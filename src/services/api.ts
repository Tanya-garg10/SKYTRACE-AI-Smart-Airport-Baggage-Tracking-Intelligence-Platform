import type {
  AirportCheckpointRecord,
  AnomalyDetectionItem,
  BaggageRecord,
  DelayRiskAssessment,
  FlightRecord,
  LostBaggageReportRecord,
  PassengerRecord,
  SafeUser,
  StaffActivityRecord,
  StaffRecord,
  TrackingEventRecord,
  TrackingInputSource,
} from '../types';
import type { ClientNotification, DemoSampleRecord, PublicStats } from '../types';

const TOKEN_KEY = 'skytrace_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return (await res.text()) as unknown as T;
  }

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Public
  getPublicStats: () => request<{ success: true; stats: PublicStats }>('/api/public/stats'),
  getDemoSamples: () => request<{ success: true; isDemoData: boolean; samples: DemoSampleRecord[] }>('/api/public/demo-samples'),
  trackDemoSample: (bagId: string) =>
    request<{ success: true; isDemoData: boolean; record: DemoSampleRecord }>(
      `/api/public/demo-tracking/${encodeURIComponent(bagId)}`
    ),

  // Auth
  login: (email: string, password: string) =>
    request<{ success: true; token: string; user: SafeUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: { fullName: string; email: string; password: string; phone?: string }) =>
    request<{ success: true; token: string; user: SafeUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () => request<{ success: true }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ success: true; user: SafeUser }>('/api/auth/me'),

  // Baggage
  listBaggage: (params?: { search?: string; status?: string; flightNumber?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    if (params?.flightNumber) qs.set('flightNumber', params.flightNumber);
    const query = qs.toString();
    return request<{ success: true; baggage: BaggageRecord[] }>(
      `/api/baggage${query ? `?${query}` : ''}`
    );
  },
  trackBaggage: (bagId: string) =>
    request<{
      success: true;
      baggage: BaggageRecord;
      flight: FlightRecord | null;
      events: TrackingEventRecord[];
      qrDataUrl: string;
    }>(`/api/baggage/track/${encodeURIComponent(bagId)}`),
  getBaggageQr: (bagId: string) =>
    request<{ success: true; bagId: string; qrDataUrl: string; qrPayload: string }>(
      `/api/baggage/${encodeURIComponent(bagId)}/qr`
    ),
  registerBaggage: (payload: {
    passengerId?: string;
    passengerName?: string;
    passengerEmail?: string;
    flightId?: string;
    flightNumber?: string;
    departureAirport?: string;
    arrivalAirport?: string;
    baggageType: BaggageRecord['baggageType'];
    color: string;
    weightKg: number;
    specialHandling?: string;
  }) =>
    request<{
      success: true;
      baggage: BaggageRecord;
      event: TrackingEventRecord;
      qrDataUrl: string;
    }>('/api/baggage/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  scanBaggage: (payload: {
    bagIdOrPayload: string;
    checkpointCode: string;
    location?: string;
    inputSource?: TrackingInputSource;
    notes?: string;
    statusOverride?: BaggageRecord['status'];
    allowOutOfOrder?: boolean;
  }) =>
    request<{
      success: true;
      baggage: BaggageRecord;
      event: TrackingEventRecord;
    }>('/api/baggage/scan', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listFlights: () => request<{ success: true; flights: FlightRecord[] }>('/api/baggage/flights/list'),
  listPassengers: () =>
    request<{ success: true; passengers: PassengerRecord[] }>('/api/baggage/passengers/list'),
  listCheckpoints: () =>
    request<{ success: true; checkpoints: AirportCheckpointRecord[] }>('/api/baggage/checkpoints/list'),

  // Reports
  listReports: () => request<{ success: true; reports: LostBaggageReportRecord[] }>('/api/reports'),
  createReport: (payload: {
    bagId: string;
    flightNumber: string;
    description: string;
    color: string;
    baggageType: string;
    lastKnownLocation: string;
    issueCategory: LostBaggageReportRecord['issueCategory'];
    details?: string;
  }) =>
    request<{ success: true; report: LostBaggageReportRecord }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateReport: (id: string, payload: { status?: LostBaggageReportRecord['status']; resolutionNotes?: string }) =>
    request<{ success: true; report: LostBaggageReportRecord }>(`/api/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Notifications
  listNotifications: () =>
    request<{ success: true; notifications: ClientNotification[]; unreadCount: number }>(
      '/api/notifications'
    ),
  markNotificationRead: (id: string) =>
    request<{ success: true }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<{ success: true }>('/api/notifications/read-all', { method: 'POST' }),

  // Admin
  adminOverview: () =>
    request<{
      success: true;
      metrics: {
        totalBaggage: number;
        registered: number;
        inTransit: number;
        delivered: number;
        delayed: number;
        missing: number;
        damaged: number;
        activeFlights: number;
        totalScans: number;
        openReports: number;
        totalUsers: number;
        activeCheckpoints: number;
      };
    }>('/api/admin/overview'),
  adminAnalytics: () =>
    request<{
      success: true;
      analytics: {
        statusBreakdown: { name: string; count: number; color: string }[];
        flightDistribution: {
          flightNumber: string;
          route: string;
          total: number;
          delivered: number;
          inTransit: number;
          exceptions: number;
        }[];
        checkpointActivity: {
          checkpoint: string;
          scans: number;
          qrScans: number;
          rfidScans: number;
        }[];
        hourlyTrend: { window: string; scans: number }[];
      };
    }>('/api/admin/analytics'),
  adminUsers: () =>
    request<{
      success: true;
      users: SafeUser[];
      staff: StaffRecord[];
      passengers: PassengerRecord[];
    }>('/api/admin/users'),
  adminCreateStaff: (payload: {
    fullName: string;
    email: string;
    password: string;
    department?: string;
    assignedTerminal?: string;
  }) =>
    request<{ success: true; user: SafeUser; staff: StaffRecord }>('/api/admin/users/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminUpdateUser: (id: string, payload: { active?: boolean; role?: SafeUser['role'] }) =>
    request<{ success: true; user: SafeUser }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  adminCreateFlight: (payload: {
    flightNumber: string;
    airline?: string;
    departureAirport: string;
    arrivalAirport: string;
    gate?: string;
    carousel?: string;
  }) =>
    request<{ success: true; flight: FlightRecord }>('/api/admin/flights', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminUpdateFlight: (id: string, payload: { status?: FlightRecord['status']; gate?: string; carousel?: string }) =>
    request<{ success: true; flight: FlightRecord }>(`/api/admin/flights/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  adminUpdateCheckpoint: (
    id: string,
    payload: { active?: boolean; zone?: string; terminal?: string; rfidGateId?: string }
  ) =>
    request<{ success: true; checkpoint: AirportCheckpointRecord }>(`/api/admin/checkpoints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  adminActivity: () =>
    request<{ success: true; activity: StaffActivityRecord[] }>('/api/admin/activity'),

  // AI Intelligence
  aiDelayRisk: (bagId?: string) =>
    request<{ success: true; assessments: DelayRiskAssessment[]; aiEnabled: boolean }>(
      `/api/ai/delay-risk${bagId ? `?bagId=${encodeURIComponent(bagId)}` : ''}`
    ),
  aiAnomalies: () =>
    request<{ success: true; anomalies: AnomalyDetectionItem[] }>('/api/ai/anomalies'),
  aiAssistant: (question: string) =>
    request<{
      success: true;
      answer: string;
      aiPowered: boolean;
      referencedBagIds: string[];
    }>('/api/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};
