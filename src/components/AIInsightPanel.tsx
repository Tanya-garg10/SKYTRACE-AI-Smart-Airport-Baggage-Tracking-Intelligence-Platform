import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  RefreshCw,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import type { AnomalyDetectionItem, DelayRiskAssessment } from '../types';

const SUGGESTED_QUESTIONS = [
  'Which bags are currently delayed?',
  'Which flights have the most pending baggage?',
  'Why is ST-2026-4811 flagged as high risk?',
  'What should staff investigate next?',
];

export function AIInsightPanel() {
  const [risks, setRisks] = useState<DelayRiskAssessment[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetectionItem[]>([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBag, setExpandedBag] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<
    { id: string; q: string; a: string; aiPowered: boolean }[]
  >([]);

  const loadIntelligence = async () => {
    setLoading(true);
    setError('');
    try {
      const [riskRes, anomRes] = await Promise.all([api.aiDelayRisk(), api.aiAnomalies()]);
      setRisks(riskRes.assessments);
      setAiEnabled(riskRes.aiEnabled);
      setAnomalies(anomRes.anomalies);
      if (riskRes.assessments.length > 0 && !expandedBag) {
        setExpandedBag(riskRes.assessments[0].bagId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load baggage intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntelligence();
  }, []);

  const handleAsk = async (promptText?: string) => {
    const q = (promptText ?? question).trim();
    if (!q || asking) return;
    setQuestion('');
    setAsking(true);
    try {
      const res = await api.aiAssistant(q);
      setQaHistory((prev) => [
        { id: `${Date.now()}`, q, a: res.answer, aiPowered: res.aiPowered },
        ...prev,
      ]);
    } catch (err) {
      setQaHistory((prev) => [
        {
          id: `${Date.now()}`,
          q,
          a: err instanceof Error ? err.message : 'Query failed.',
          aiPowered: false,
        },
        ...prev,
      ]);
    } finally {
      setAsking(false);
    }
  };

  const highCount = risks.filter((r) => r.riskLevel === 'High').length;
  const medCount = risks.filter((r) => r.riskLevel === 'Medium').length;
  const lowCount = risks.filter((r) => r.riskLevel === 'Low').length;
  const totalCount = Math.max(1, risks.length);

  return (
    <div className="space-y-6">
      {/* Header + Risk Spectrum Overview */}
      <div className="rounded-2xl border border-[#A8B6C7]/18 bg-[#203650]/55 overflow-hidden">
        <div className="h-[2px] bg-ma-gold opacity-75" />
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono tracking-[0.16em] text-[#C9A96E]">
                PREDICTIVE BAGGAGE TELEMETRY
              </div>
              <h3 className="mt-1 text-base font-semibold text-[#F3F5F7]">
                Investigative Risk Spectrum &amp; Anomaly Telemetry
              </h3>
              <p className="text-xs text-[#A8B6C7] mt-0.5">
                {aiEnabled
                  ? 'AI reasoning layered over live database checkpoint telemetry.'
                  : 'Deterministic checkpoint telemetry rules active (grounded fallback mode).'}
              </p>
            </div>
            <button
              type="button"
              onClick={loadIntelligence}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#A8B6C7]/25 hover:border-[#54D6E8] text-xs font-medium text-[#F3F5F7] cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#54D6E8] ${loading ? 'animate-spin' : ''}`} />
              Refresh Telemetry
            </button>
          </div>

          {/* Visual Risk Spectrum Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#52C7A5]">Low Risk ({lowCount})</span>
              <span className="text-[#C9A96E]">Elevated / Gold ({medCount})</span>
              <span className="text-[#E87583]">Critical / Coral ({highCount})</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden bg-[#101B2D] border border-[#A8B6C7]/20 flex">
              <div
                style={{ width: `${(lowCount / totalCount) * 100}%` }}
                className="bg-[#52C7A5] transition-all duration-500"
              />
              <div
                style={{ width: `${(medCount / totalCount) * 100}%` }}
                className="bg-[#C9A96E] transition-all duration-500"
              />
              <div
                style={{ width: `${(highCount / totalCount) * 100}%` }}
                className="bg-[#E87583] transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-[#E87583]/40 bg-[#E87583]/10 text-xs text-[#E87583]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Risk Evidence & Anomaly Findings */}
        <div className="xl:col-span-7 space-y-6">
          <div className="rounded-2xl border border-[#A8B6C7]/18 bg-[#101B2D] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#A8B6C7]/15 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#F3F5F7]">
                Prioritized Baggage Investigations
              </span>
              <span className="text-xs font-mono text-[#A8B6C7] tabular-nums">
                {risks.length} Active Journeys Evaluated
              </span>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-[#203650]/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[#A8B6C7]/10">
                {risks.map((item) => {
                  const isExpanded = expandedBag === item.bagId;
                  const scoreColor =
                    item.riskLevel === 'High'
                      ? 'text-[#E87583]'
                      : item.riskLevel === 'Medium'
                      ? 'text-[#C9A96E]'
                      : 'text-[#52C7A5]';

                  return (
                    <div key={item.bagId} className="p-4">
                      <button
                        type="button"
                        onClick={() => setExpandedBag(isExpanded ? null : item.bagId)}
                        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5 text-sm">
                            <span className="font-mono font-bold text-[#F3F5F7] tabular-nums">
                              {item.bagId}
                            </span>
                            <span className="text-[#A8B6C7]">·</span>
                            <span className="font-mono text-xs text-[#54D6E8]">
                              {item.flightNumber}
                            </span>
                            <span className="text-[#A8B6C7]">·</span>
                            <span className="text-xs text-[#A8B6C7] truncate">
                              {item.passengerName}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-[#A8B6C7] truncate">
                            {item.explanation}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`font-mono text-xs font-bold tabular-nums ${scoreColor}`}>
                            {item.riskScore}/100 · {item.riskLevel}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-[#A8B6C7] transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[#A8B6C7]/10 space-y-2 text-xs">
                          <div className="text-[#A8B6C7] space-y-1">
                            {item.evidence.map((ev, idx) => (
                              <div key={idx}>• {ev}</div>
                            ))}
                          </div>
                          <div className="text-[#54D6E8] font-medium">
                            Recommended Action: {item.recommendedAction}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#A8B6C7]/18 bg-[#101B2D] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#A8B6C7]/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F0B85B]" />
                <span className="text-sm font-semibold text-[#F3F5F7]">
                  Unusual Movement Alerts
                </span>
              </div>
              <span className="text-xs font-mono text-[#C9A96E]">{anomalies.length} Flagged</span>
            </div>
            <div className="divide-y divide-[#A8B6C7]/10">
              {anomalies.map((a) => (
                <div key={a.id} className="p-4 flex items-start gap-3 text-xs">
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      a.severity === 'High' ? 'text-[#E87583]' : 'text-[#F0B85B]'
                    }`}
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="font-semibold text-[#F3F5F7]">
                      <span className="font-mono text-[#54D6E8]">{a.bagId}</span> · {a.summary}
                    </div>
                    <div className="text-[#A8B6C7]">{a.evidence}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Grounded Investigation Query Interface */}
        <div className="xl:col-span-5 rounded-2xl border border-[#A8B6C7]/18 bg-[#203650]/65 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#A8B6C7]/15 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F3F5F7]">
              <Bot className="w-4 h-4 text-[#54D6E8]" />
              <span>Grounded Operations Query</span>
            </div>
            <span className="text-[11px] font-mono text-[#C9A96E]">LIVE DB EVIDENCE</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAsk(q)}
                className="px-2.5 py-1.5 rounded-lg border border-[#A8B6C7]/20 text-[11px] text-[#A8B6C7] hover:border-[#54D6E8] hover:text-[#F3F5F7] transition-colors cursor-pointer text-left"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Query Bag IDs, delays, or flight queues..."
              className="flex-1 px-3 py-2.5 rounded-lg border border-[#A8B6C7]/25 bg-[#101B2D] text-xs text-[#F3F5F7]"
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="px-4 py-2.5 rounded-lg bg-ma-aurora disabled:opacity-50 text-[#101B2D] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 hover:opacity-95"
            >
              <Send className="w-3.5 h-3.5" />
              Query
            </button>
          </form>

          {asking && (
            <div className="p-3 rounded-lg bg-[#101B2D]/70 text-xs text-[#54D6E8] animate-pulse">
              Evaluating live tracking events...
            </div>
          )}

          <div className="space-y-3 max-h-[380px] overflow-y-auto">
            {qaHistory.length === 0 ? (
              <div className="p-4 rounded-xl border border-[#A8B6C7]/12 bg-[#101B2D]/70 text-xs text-[#A8B6C7] leading-relaxed">
                Select a suggested operational prompt above or enter a Bag ID to inspect real-time evidence without fabricated records.
              </div>
            ) : (
              qaHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-[#A8B6C7]/18 bg-[#101B2D]/90 space-y-2 text-xs"
                >
                  <div className="font-semibold text-[#54D6E8]">{item.q}</div>
                  <div className="text-[#F3F5F7] whitespace-pre-line leading-relaxed">
                    {item.a}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
