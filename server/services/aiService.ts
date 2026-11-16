import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  AnomalyDetectionItem,
  BaggageRecord,
  CHECKPOINT_FLOW,
  DelayRiskAssessment,
  FlightRecord,
  LostBaggageReportRecord,
  TrackingEventRecord,
} from '../../src/shared/types.js';
import { db } from '../db/database.js';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error(`AI request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getCheckpointOrder(code: string): number {
  const found = CHECKPOINT_FLOW.find((c) => c.code === code);
  return found ? found.order : 0;
}

export function computeDeterministicAnomalies(
  baggageList: BaggageRecord[],
  eventsList: TrackingEventRecord[]
): AnomalyDetectionItem[] {
  const anomalies: AnomalyDetectionItem[] = [];
  const eventsByBag = new Map<string, TrackingEventRecord[]>();

  for (const ev of eventsList) {
    const arr = eventsByBag.get(ev.bagId) ?? [];
    arr.push(ev);
    eventsByBag.set(ev.bagId, arr);
  }

  for (const bag of baggageList) {
    const events = (eventsByBag.get(bag.bagId) ?? []).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (events.length === 0) continue;

    // 1. Check duplicate scans at the same checkpoint
    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const curr = events[i];
      if (prev.checkpointCode === curr.checkpointCode) {
        const diffMins = Math.round(
          (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 60_000
        );
        anomalies.push({
          id: `anom-dup-${curr.id}`,
          bagId: bag.bagId,
          flightNumber: bag.flightNumber,
          anomalyType: 'DUPLICATE_SCAN',
          severity: 'Medium',
          summary: `Repeated scan at ${curr.checkpointName}`,
          evidence: `Scanned twice at ${curr.checkpointName} (${curr.location}) within ${diffMins} minute(s).`,
          detectedAt: curr.timestamp,
        });
      }

      const prevOrder = getCheckpointOrder(prev.checkpointCode);
      const currOrder = getCheckpointOrder(curr.checkpointCode);

      // 2. Skipped intermediate checkpoint(s)
      if (currOrder - prevOrder > 1) {
        const skipped = CHECKPOINT_FLOW.filter(
          (c) => c.order > prevOrder && c.order < currOrder
        ).map((c) => c.label);
        anomalies.push({
          id: `anom-skip-${curr.id}`,
          bagId: bag.bagId,
          flightNumber: bag.flightNumber,
          anomalyType: 'SKIPPED_CHECKPOINT',
          severity: skipped.includes('Security Screening') ? 'High' : 'Medium',
          summary: `Skipped ${skipped.join(', ')}`,
          evidence: `Moved directly from ${prev.checkpointName} to ${curr.checkpointName} without recording ${skipped.join(', ')}.`,
          detectedAt: curr.timestamp,
        });
      }

      // 3. Out-of-order regression
      if (currOrder < prevOrder) {
        anomalies.push({
          id: `anom-order-${curr.id}`,
          bagId: bag.bagId,
          flightNumber: bag.flightNumber,
          anomalyType: 'OUT_OF_ORDER_SEQUENCE',
          severity: 'High',
          summary: `Backward checkpoint sequence`,
          evidence: `Moved backward from ${prev.checkpointName} (step ${prevOrder}) to ${curr.checkpointName} (step ${currOrder}).`,
          detectedAt: curr.timestamp,
        });
      }
    }

    // 4. Extended dwell time in non-terminal states
    const lastEv = events[events.length - 1];
    const dwellMins = Math.round((Date.now() - new Date(lastEv.timestamp).getTime()) / 60_000);
    if (
      bag.status !== 'delivered' &&
      bag.status !== 'loaded' &&
      bag.status !== 'carousel' &&
      dwellMins > 45
    ) {
      anomalies.push({
        id: `anom-dwell-${bag.bagId}`,
        bagId: bag.bagId,
        flightNumber: bag.flightNumber,
        anomalyType: 'EXTENDED_DWELL',
        severity: dwellMins > 70 ? 'High' : 'Medium',
        summary: `Extended dwell (${dwellMins}m) at ${lastEv.checkpointName}`,
        evidence: `Last recorded event was ${dwellMins} minutes ago at ${lastEv.location} with status "${bag.status}".`,
        detectedAt: lastEv.timestamp,
      });
    }

    // 5. Unusual status transition (missing/damaged/delayed)
    if (bag.status === 'missing' || bag.status === 'damaged') {
      anomalies.push({
        id: `anom-stat-${bag.bagId}`,
        bagId: bag.bagId,
        flightNumber: bag.flightNumber,
        anomalyType: 'UNUSUAL_STATUS_TRANSITION',
        severity: 'High',
        summary: `Baggage flagged as ${bag.status}`,
        evidence: `Current status is "${bag.status}" at ${bag.currentLocation}.`,
        detectedAt: bag.updatedAt,
      });
    }
  }

  return anomalies.sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );
}

export function computeDeterministicDelayRisks(
  baggageList: BaggageRecord[],
  eventsList: TrackingEventRecord[],
  flightsList: FlightRecord[]
): DelayRiskAssessment[] {
  const flightMap = new Map(flightsList.map((f) => [f.id, f]));
  const eventsByBag = new Map<string, TrackingEventRecord[]>();
  for (const ev of eventsList) {
    const arr = eventsByBag.get(ev.bagId) ?? [];
    arr.push(ev);
    eventsByBag.set(ev.bagId, arr);
  }

  const assessments: DelayRiskAssessment[] = [];

  for (const bag of baggageList) {
    if (bag.status === 'delivered') continue;

    const events = (eventsByBag.get(bag.bagId) ?? []).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const flight = flightMap.get(bag.flightId);
    const lastEvent = events[events.length - 1];
    const dwellMins = lastEvent
      ? Math.max(0, Math.round((Date.now() - new Date(lastEvent.timestamp).getTime()) / 60_000))
      : 0;

    const currentOrder = getCheckpointOrder(bag.currentCheckpointCode);
    const minsToDep = flight
      ? Math.round((new Date(flight.departureTime).getTime() - Date.now()) / 60_000)
      : null;

    let score = 10;
    const evidence: string[] = [];

    if (bag.status === 'missing') {
      score = 96;
      evidence.push(`Bag status is explicitly flagged as missing at ${bag.currentLocation}.`);
    } else if (bag.status === 'delayed') {
      score += 45;
      evidence.push(`Bag is currently marked delayed at ${bag.currentLocation}.`);
    } else if (bag.status === 'damaged') {
      score += 40;
      evidence.push(`Damage reported at ${bag.currentLocation}; requires inspection.`);
    }

    if (dwellMins > 40 && currentOrder < 5) {
      score += Math.min(35, Math.round(dwellMins / 3));
      evidence.push(`Dwell time of ${dwellMins} minutes since last scan at ${lastEvent?.checkpointName ?? bag.currentCheckpointCode}.`);
    }

    if (minsToDep !== null && minsToDep > 0 && minsToDep <= 60 && currentOrder < 5) {
      score += 30;
      evidence.push(`Flight ${bag.flightNumber} departs in ${minsToDep} minutes, while bag is at step ${currentOrder}/8 (${bag.currentCheckpointCode}).`);
    }

    if (flight?.status === 'delayed') {
      score += 20;
      evidence.push(`Flight ${flight.flightNumber} operational status is currently delayed.`);
    }

    // Missing expected checkpoints check
    const expectedOrders = events.map((e) => getCheckpointOrder(e.checkpointCode));
    for (let i = 1; i < expectedOrders.length; i++) {
      if (expectedOrders[i] - expectedOrders[i - 1] > 1) {
        score += 20;
        evidence.push(`Missing intermediate checkpoint scan between step ${expectedOrders[i - 1]} and step ${expectedOrders[i]}.`);
        break;
      }
    }

    score = Math.min(99, score);
    const riskLevel: 'Low' | 'Medium' | 'High' =
      score >= 65 ? 'High' : score >= 35 ? 'Medium' : 'Low';

    if (evidence.length === 0) {
      evidence.push(`Nominal progression (${events.length} checkpoint scans recorded, last scan ${dwellMins}m ago).`);
    }

    let explanation = `Baggage ${bag.bagId} shows ${riskLevel.toLowerCase()} delay risk based on recorded checkpoint telemetry.`;
    let recommendedAction = 'Continue standard automated conveyor and ramp monitoring.';

    if (riskLevel === 'High') {
      explanation = `${bag.bagId} (${bag.flightNumber}) requires immediate intervention due to ${
        bag.status === 'missing'
          ? 'missing status after arrival offload'
          : `extended ${dwellMins}m hold before aircraft loading`
      }.`;
      recommendedAction =
        bag.status === 'missing'
          ? `Dispatch ramp tracer team to ${bag.currentLocation} and verify ULD offload manifest.`
          : `Send ground runner to ${bag.currentLocation} for direct cart transfer to gate ${flight?.gate ?? 'stand'}.`;
    } else if (riskLevel === 'Medium') {
      explanation = `${bag.bagId} exhibits moderate risk from ${flight?.status === 'delayed' ? 'flight schedule delay' : 'checkpoint sequence irregularity'}.`;
      recommendedAction = `Verify checkpoint scan integrity at ${bag.currentLocation} within 15 minutes.`;
    }

    assessments.push({
      bagId: bag.bagId,
      flightNumber: bag.flightNumber,
      passengerName: bag.passengerName,
      currentStatus: bag.status,
      currentLocation: bag.currentLocation,
      riskLevel,
      riskScore: score,
      explanation,
      evidence,
      recommendedAction,
      aiPowered: false,
    });
  }

  return assessments.sort((a, b) => b.riskScore - a.riskScore);
}

export async function analyzeDelayRisksWithAI(targetBagId?: string): Promise<{
  assessments: DelayRiskAssessment[];
  aiEnabled: boolean;
}> {
  const [baggageList, eventsList, flightsList] = await Promise.all([
    db.getBaggage(),
    db.getTrackingEvents(),
    db.getFlights(),
  ]);

  const filteredBags = targetBagId
    ? baggageList.filter((b) => b.bagId.toUpperCase() === targetBagId.toUpperCase())
    : baggageList;

  const baseAssessments = computeDeterministicDelayRisks(filteredBags, eventsList, flightsList);
  const ai = getGeminiClient();

  if (!ai || baseAssessments.length === 0) {
    return { assessments: baseAssessments, aiEnabled: false };
  }

  // Enrich top 4 highest-risk assessments with Gemini while strictly preserving grounded evidence
  const toEnrich = baseAssessments.slice(0, 4);
  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analyze these grounded airport baggage risk summaries and refine the operational explanation and recommended staff action for each Bag ID. Do NOT invent any new locations, timestamps, or bag IDs.\n\n${JSON.stringify(
          toEnrich,
          null,
          2
        )}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are SKYTRACE AI, an aviation baggage operations analyst. Return concise, factual operational explanations and actionable ground-crew steps grounded strictly in the provided JSON evidence.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                bagId: { type: Type.STRING },
                explanation: { type: Type.STRING },
                recommendedAction: { type: Type.STRING },
              },
              required: ['bagId', 'explanation', 'recommendedAction'],
            },
          },
        },
      }),
      8000
    );

    const parsed = JSON.parse((response.text ?? '[]').trim()) as {
      bagId: string;
      explanation: string;
      recommendedAction: string;
    }[];

    const enrichedMap = new Map(parsed.map((item) => [item.bagId, item]));
    const merged = baseAssessments.map((a) => {
      const aiItem = enrichedMap.get(a.bagId);
      if (!aiItem) return a;
      return {
        ...a,
        explanation: aiItem.explanation,
        recommendedAction: aiItem.recommendedAction,
        aiPowered: true,
      };
    });
    return { assessments: merged, aiEnabled: true };
  } catch (err) {
    console.warn('[SKYTRACE AI] Gemini enrichment fallback triggered:', (err as Error).message);
    return { assessments: baseAssessments, aiEnabled: false };
  }
}

export async function askOperationsAssistant(question: string): Promise<{
  answer: string;
  aiPowered: boolean;
  referencedBagIds: string[];
}> {
  const [baggageList, eventsList, flightsList, reportsList] = await Promise.all([
    db.getBaggage(),
    db.getTrackingEvents(),
    db.getFlights(),
    db.getReports(),
  ]);

  const risks = computeDeterministicDelayRisks(baggageList, eventsList, flightsList);
  const anomalies = computeDeterministicAnomalies(baggageList, eventsList);

  const contextSnapshot = {
    flights: flightsList.map((f) => ({
      flightNumber: f.flightNumber,
      route: `${f.departureAirport}->${f.arrivalAirport}`,
      status: f.status,
      gate: f.gate,
      departureTime: f.departureTime,
    })),
    baggage: baggageList.map((b) => ({
      bagId: b.bagId,
      flightNumber: b.flightNumber,
      passengerName: b.passengerName,
      status: b.status,
      checkpoint: b.currentCheckpointCode,
      location: b.currentLocation,
      updatedAt: b.updatedAt,
    })),
    delayRisks: risks.map((r) => ({
      bagId: r.bagId,
      riskLevel: r.riskLevel,
      riskScore: r.riskScore,
      evidence: r.evidence,
      recommendedAction: r.recommendedAction,
    })),
    anomalies: anomalies.map((a) => ({
      bagId: a.bagId,
      type: a.anomalyType,
      severity: a.severity,
      evidence: a.evidence,
    })),
    openReports: reportsList.map((r) => ({
      bagId: r.bagId,
      category: r.issueCategory,
      status: r.status,
      lastKnownLocation: r.lastKnownLocation,
    })),
  };

  const mentionedBags = baggageList
    .filter((b) => question.toUpperCase().includes(b.bagId.toUpperCase()))
    .map((b) => b.bagId);

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Operations Question: ${question}\n\nLive Database Snapshot:\n${JSON.stringify(
            contextSnapshot
          )}`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'You are SKYTRACE AI Operations Assistant. Answer the staff or admin question accurately using ONLY the provided Live Database Snapshot. Never invent Bag IDs, flights, timestamps, or tracking events. Keep responses structured, concise, and actionable.',
          },
        }),
        8000
      );
      const text = response.text?.trim();
      if (text) {
        const referenced = baggageList
          .filter((b) => text.includes(b.bagId))
          .map((b) => b.bagId);
        return {
          answer: text,
          aiPowered: true,
          referencedBagIds: Array.from(new Set([...mentionedBags, ...referenced])),
        };
      }
    } catch (err) {
      console.warn('[SKYTRACE AI] Assistant Gemini call failed, using grounded fallback:', (err as Error).message);
    }
  }

  // Deterministic grounded fallback
  const answer = buildDeterministicAssistantReply(
    question,
    baggageList,
    flightsList,
    risks,
    anomalies,
    reportsList
  );
  const referenced = baggageList
    .filter((b) => answer.includes(b.bagId))
    .map((b) => b.bagId);
  return {
    answer,
    aiPowered: false,
    referencedBagIds: Array.from(new Set([...mentionedBags, ...referenced])),
  };
}

function buildDeterministicAssistantReply(
  question: string,
  baggage: BaggageRecord[],
  flights: FlightRecord[],
  risks: DelayRiskAssessment[],
  anomalies: AnomalyDetectionItem[],
  reports: LostBaggageReportRecord[]
): string {
  const q = question.toLowerCase();

  // Specific Bag ID lookup
  const exactBag = baggage.find((b) => q.includes(b.bagId.toLowerCase()));
  if (exactBag) {
    const risk = risks.find((r) => r.bagId === exactBag.bagId);
    const bagAnoms = anomalies.filter((a) => a.bagId === exactBag.bagId);
    const lines = [
      `Baggage ${exactBag.bagId} (${exactBag.flightNumber}, ${exactBag.departureAirport} -> ${exactBag.arrivalAirport}) is currently "${exactBag.status}" at ${exactBag.currentLocation}.`,
    ];
    if (risk) {
      lines.push(`Risk Assessment: ${risk.riskLevel} (${risk.riskScore}/100). Evidence: ${risk.evidence.join(' ')}`);
      lines.push(`Recommended Action: ${risk.recommendedAction}`);
    }
    if (bagAnoms.length > 0) {
      lines.push(`Anomalies Detected: ${bagAnoms.map((a) => a.summary).join('; ')}.`);
    }
    return lines.join('\n\n');
  }

  if (q.includes('delay') || q.includes('risk') || q.includes('late')) {
    const highOrDelayed = risks.filter(
      (r) => r.riskLevel === 'High' || r.currentStatus === 'delayed' || r.currentStatus === 'missing'
    );
    if (highOrDelayed.length === 0) {
      return 'No baggage items are currently flagged as delayed or high risk in the database.';
    }
    return `Currently flagged high-risk or delayed bags (${highOrDelayed.length}):\n` +
      highOrDelayed
        .map(
          (r) =>
            `• ${r.bagId} (${r.flightNumber}) — Status: ${r.currentStatus}, Risk: ${r.riskLevel} (${r.riskScore}/100). ${r.recommendedAction}`
        )
        .join('\n');
  }

  if (q.includes('flight') || q.includes('pending')) {
    const counts = flights.map((f) => {
      const pending = baggage.filter(
        (b) => b.flightId === f.id && b.status !== 'delivered' && b.status !== 'loaded'
      );
      return { flightNumber: f.flightNumber, route: `${f.departureAirport}->${f.arrivalAirport}`, count: pending.length };
    }).sort((a, b) => b.count - a.count);

    return `Pending baggage breakdown by flight:\n` +
      counts.map((c) => `• ${c.flightNumber} (${c.route}): ${c.count} pending bag(s)`).join('\n');
  }

  if (q.includes('anomal') || q.includes('suspicious') || q.includes('duplicate') || q.includes('skip')) {
    if (anomalies.length === 0) {
      return 'No checkpoint anomalies detected in recorded tracking events.';
    }
    return `Recorded checkpoint anomalies (${anomalies.length}):\n` +
      anomalies.slice(0, 5).map((a) => `• ${a.bagId} (${a.flightNumber}) — ${a.summary}: ${a.evidence}`).join('\n');
  }

  if (q.includes('next') || q.includes('investigate') || q.includes('report') || q.includes('missing')) {
    const topRisk = risks[0];
    const openRep = reports.filter((r) => r.status === 'open' || r.status === 'investigating');
    const parts: string[] = [];
    if (topRisk) {
      parts.push(`Top Priority Investigation: ${topRisk.bagId} (${topRisk.flightNumber}) — ${topRisk.recommendedAction}`);
    }
    if (openRep.length > 0) {
      parts.push(
        `Open Incident Reports (${openRep.length}): ` +
          openRep.map((r) => `${r.bagId} (${r.issueCategory}, ${r.status})`).join(', ')
      );
    }
    return parts.join('\n\n') || 'All tracked baggage operations are currently nominal.';
  }

  return `Operational Summary (Grounded in Live Records):\n• Total Tracked Bags: ${baggage.length}\n• High-Risk / Missing / Delayed: ${
    risks.filter((r) => r.riskLevel === 'High').length
  }\n• Detected Anomalies: ${anomalies.length}\n• Open Incident Reports: ${
    reports.filter((r) => r.status !== 'resolved' && r.status !== 'closed').length
  }\n\nAsk about a specific Bag ID (e.g., ST-2026-4811), delayed bags, flight pending counts, or anomalies.`;
}
