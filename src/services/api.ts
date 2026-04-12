import { getIdToken } from '../hooks/useAuth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const token = await getIdToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

async function get<T>(path: string, authenticated = true): Promise<T> {
  const headers = authenticated ? await authHeaders() : { 'Content-Type': 'application/json' };
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post<T>(path: string, body: unknown, authenticated = true): Promise<T> {
  const headers = authenticated ? await authHeaders() : { 'Content-Type': 'application/json' };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Project types (must match backend src/types/project.ts) ─────────
export type PropertyType = 'PROJECT' | 'PLOT' | 'FARMLAND';
export type ProjectType = 'GATED_SOCIETY' | 'SEMI_GATED' | 'STAND_ALONE' | 'VILLA_COMMUNITY' | 'ULTRA_LUXURY';
export type ProjectSegment = 'PREMIUM' | 'ECONOMY' | 'SUPER_LUXURY';
export type PossessionStatus = 'RTMI' | 'UNDER_CONSTRUCTION' | 'EOI';
export type DensityType = 'LOW_DENSITY' | 'MEDIUM_DENSITY' | 'HIGH_DENSITY';
export type ProjectZone = 'WEST' | 'EAST' | 'SOUTH' | 'NORTH' | 'CENTRAL';
export type ProjectStatus = 'ACTIVE' | 'INACTIVE' | 'COMING_SOON' | 'PENDING_APPROVAL';

export interface ProjectConfiguration {
  bhkCount: number;
  minSft: number;
  maxSft: number;
  unitCount: number;
}

export interface CreateProjectInput {
  name: string;
  developerName: string;
  reraNumber?: string;
  propertyType: PropertyType;
  projectType?: ProjectType;
  projectSegment?: ProjectSegment;
  possessionStatus?: PossessionStatus;
  possessionDate?: string;
  address?: string;
  zone?: ProjectZone;
  location?: string;
  area?: string;
  city: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  mapLink?: string;
  landParcel?: number;
  numberOfTowers?: number;
  totalUnits?: number;
  availableUnits?: number;
  density?: DensityType;
  sftCostingPerSqft?: number;
  emiStartsFrom?: string;
  pricingTwoBhk?: number;
  pricingThreeBhk?: number;
  pricingFourBhk?: number;
  videoLink3D?: string;
  brochureLink?: string;
  onboardingAgreementLink?: string;
  projectManagerName?: string;
  projectManagerContact?: string;
  spocName?: string;
  spocContact?: string;
  usp?: string;
  teaser?: string;
  details?: string;
  status?: ProjectStatus;
  leadRegistrationStatus?: string;
  configurations?: ProjectConfiguration[];
  photos?: string[];
  amenities?: string[];
}

export type UpdateProjectInput = Partial<Omit<CreateProjectInput, 'propertyType'>> & {
  propertyType?: PropertyType;
};

export const api = {
  // ── Projects ──────────────────────────────────────────────────────
  getProjects: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<any>(`/projects${qs}`, false);
  },
  getProject: (id: string) => get<any>(`/projects/${id}`, false),
  addProperty: (data: CreateProjectInput) => post<any>('/admin/properties', data),
  updateProperty: (id: string, data: UpdateProjectInput) => patch<any>(`/admin/properties/${id}`, data),
  updateProject: (id: string, data: any) => patch<any>(`/admin/properties/${id}`, data),
  deleteProperty: (id: string) => del<any>(`/admin/properties/${id}`),
  deleteProject: (id: string) => del<any>(`/admin/properties/${id}`),
  approveProject: (id: string) => post<any>(`/admin/properties/${id}/approve`, {}),
  rejectProject: (id: string) => post<any>(`/admin/properties/${id}/reject`, {}),
  getPendingProjects: () => get<any>('/projects?status=PENDING_APPROVAL'),
  getMyOnboardedProjects: () => get<any>('/projects?status=PENDING_APPROVAL'),
  getBackupSheetUrl: () => get<{ sheetUrl: string }>('/admin/settings/backup-sheet'),
  getPublicStats: () => get<any>('/public/stats', false),

  // ── Leads ─────────────────────────────────────────────────────────
  getLeads: () => get<any>('/leads'),
  createLead: (data: any) => post<any>('/leads', data),
  updateLead: (id: string, data: any) => patch<any>(`/leads/${id}`, data),
  autoAssignLeads: () => post<any>('/leads/auto-assign', {}),

  // ── Earnings ──────────────────────────────────────────────────────
  getEarnings: () => get<any>('/earnings'),

  // ── Submissions ───────────────────────────────────────────────────
  getAdminSubmissions: (email?: string) => {
    const qs = email ? `?email=${encodeURIComponent(email)}` : '';
    return get<any>(`/submissions${qs}`);
  },
  getPartnerSubmissions: () => get<any>('/partner/submissions'),
  createSubmission: (data: any) => post<any>('/submissions', data),
  updateSubmissionStatus: (id: string, status: string, remarks: string) =>
    patch<any>(`/submissions/${id}/status`, { status, remarks }),
  updateSubmissionDetails: (id: string, details: any) =>
    patch<any>(`/submissions/${id}`, details),

  // ── Enquiries ─────────────────────────────────────────────────────
  getAdminEnquiries: () => get<any>('/enquiries'),
  createEnquiry: (data: any) => post<any>('/enquiries', data, false),
  updateEnquiryStatus: (id: string, status: string, priority?: string) =>
    patch<any>(`/enquiries/${id}/status`, { status, priority }),
  getEnquiryTimeline: (id: string) => get<any>(`/enquiries/${id}/timeline`),
  assignEnquiry: (id: string, data: any) =>
    post<any>(`/admin/enquiries/${id}/assign`, data),
  updatePartnerEnquiryStatus: (id: string, status: string) =>
    patch<any>(`/partner/enquiries/${id}/status`, { status }),

  // ── Admin ─────────────────────────────────────────────────────────
  getSalesTeam: () => get<any>('/admin/sales-team'),
  getPartners: () => get<any>('/admin/partners'),
  getAdminUsers: () => get<any>('/admin/users'),
  createAdminUser: (data: { name: string; phone: string; email?: string }) =>
    post<any>('/admin/users', data),
  updateAdminUser: (
    uid: string,
    data: { name?: string; email?: string; phone?: string; status?: 'active' | 'disabled' }
  ) => patch<any>(`/admin/users/${uid}`, data),
  deleteAdminUser: (uid: string) => del<any>(`/admin/users/${uid}`),
  getEmployees: () => get<any>('/admin/employees'),
  createEmployee: (data: { name: string; phone: string; role: 'howzer_sourcing' | 'howzer_sales' }) =>
    post<any>('/admin/employees', data),
  updateEmployee: (
    uid: string,
    data: { name?: string; role?: 'howzer_sourcing' | 'howzer_sales'; status?: 'active' | 'disabled' }
  ) => patch<any>(`/admin/employees/${uid}`, data),
  deleteEmployee: (uid: string) => del<any>(`/admin/employees/${uid}`),
  getClientLogins: () => get<any>('/admin/client-logins'),
  getClientLoginStats: () => get<any>('/admin/client-login-stats'),
  deleteClient: (uid: string) => del<any>(`/admin/clients/${uid}`),
  getClient360: (email: string) =>
    get<any>(`/admin/client-360/${encodeURIComponent(email)}`),

  // ── Client ────────────────────────────────────────────────────────
  getClientEnquiries: (email: string) =>
    get<any>(`/client/enquiries?email=${encodeURIComponent(email)}`),
  trackClientLogin: (data: any) => post<any>('/client/login-track', data, false),
  trackClientLogout: (id: string) => post<any>('/client/logout-track', { id }, false),

  // ── Pilot / Partner ───────────────────────────────────────────────
  getPilotAssignedEnquiries: () => get<any>('/pilot/assigned-enquiries'),
  getPartnerAssignedEnquiries: () => get<any>('/partner/assigned-enquiries'),

  // ── Attendance ────────────────────────────────────────────────────
  punchIn: (data: { photo?: string; location?: { lat: number; lng: number }; userEmail?: string }) =>
    post<any>('/attendance/punch-in', data),
  punchOut: (data: { photo?: string; location?: { lat: number; lng: number }; userEmail?: string }) =>
    post<any>('/attendance/punch-out', data),
  getTodayAttendance: (email: string, date?: string) => {
    const qs = new URLSearchParams({ email, ...(date ? { date } : {}) }).toString();
    return get<any>(`/attendance?${qs}`);
  },
  getAttendanceHistory: (email: string) =>
    get<any>(`/attendance/history?email=${encodeURIComponent(email)}`),
  logLocation: (data: { lat: number; lng: number; userEmail?: string }) =>
    post<any>('/attendance/location', data),

  // ── Google Calendar ───────────────────────────────────────────────
  getCalendarAuthUrl: (redirectUri: string) =>
    get<any>(`/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}`, false),
  getCalendarEvents: () => get<any>('/calendar/events', false),
  createCalendarEvent: (data: any) => post<any>('/calendar/events', data, false),
  getCalendarStatus: () => get<any>('/calendar/status', false),

  // ── Resale Properties ─────────────────────────────────────────────
  getResaleProperties: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<any>(`/resale${qs}`, false);
  },
  getResaleProperty: (id: string) => get<any>(`/resale/${id}`, false),
  submitResaleProperty: (data: {
    title: string;
    description?: string;
    price: string;
    propertyType: string;
    city: string;
    location?: string;
    area?: string;
    bedrooms?: number;
    bathrooms?: number;
    images?: string[];
  }) => post<any>('/resale', data),
  getMyResaleProperties: () => get<any>('/resale/mine'),
  getAdminResaleProperties: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<any>(`/admin/resale${qs}`);
  },
  createAdminResaleProperty: (data: any) => post<any>('/admin/resale', data),
  updateResaleStatus: (id: string, status: 'Listed' | 'Rejected', remarks?: string) =>
    patch<any>(`/admin/resale/${id}/status`, { status, ...(remarks ? { remarks } : {}) }),
  updateResaleProperty: (id: string, data: any) => patch<any>(`/admin/resale/${id}`, data),
  deleteResaleProperty: (id: string) => del<any>(`/admin/resale/${id}`),

  textToSpeech: (text: string, languageCode = 'en-IN', voiceName?: string) =>
    post<{ audioContent: string }>('/chat/tts', { text, languageCode, ...(voiceName ? { voiceName } : {}) }, false),

  // ── AI Chat Agent ─────────────────────────────────────────────────
  createChatSession: () => post<{ session_id: string }>('/chat/sessions', {}, false),
  listChatSessions: () => get<any>('/chat/sessions'),
  getChatSession: (id: string) => get<any>(`/chat/sessions/${id}`),
  deleteChatSession: (id: string) => del<any>(`/chat/sessions/${id}`),
  sendChatMessage: (id: string, message: string) =>
    post<{ reply: string; tool_results?: any[] }>(`/chat/sessions/${id}/message`, { message }, false),
};

