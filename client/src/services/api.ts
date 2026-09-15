const API_BASE = '/api';

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => request('/auth/me'),

  // Analyses
  getAnalyses: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/analyses${qs}`);
  },

  getAnalysis: (id: number) => request(`/analyses/${id}`),

  createAnalysis: (data: any) =>
    request('/analyses', { method: 'POST', body: JSON.stringify(data) }),

  updateAnalysis: (id: number, data: any) =>
    request(`/analyses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAnalysis: (id: number) =>
    request(`/analyses/${id}`, { method: 'DELETE' }),

  // Personnel
  getPersonnel: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/personnel${qs}`);
  },

  getPersonnelRecord: (id: number) => request(`/personnel/${id}`),

  createPersonnel: (data: any) =>
    request('/personnel', { method: 'POST', body: JSON.stringify(data) }),

  updatePersonnel: (id: number, data: any) =>
    request(`/personnel/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deletePersonnel: (id: number) =>
    request(`/personnel/${id}`, { method: 'DELETE' }),

  // Water
  getWaterSamples: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/water${qs}`);
  },

  getWaterSample: (id: number) => request(`/water/${id}`),

  createWaterSample: (data: any) =>
    request('/water', { method: 'POST', body: JSON.stringify(data) }),

  updateWaterSample: (id: number, data: any) =>
    request(`/water/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteWaterSample: (id: number) =>
    request(`/water/${id}`, { method: 'DELETE' }),

  // Media
  getMedia: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/media${qs}`);
  },

  getMediaItem: (id: number) => request(`/media/${id}`),

  createMedia: (data: any) =>
    request('/media', { method: 'POST', body: JSON.stringify(data) }),

  updateMedia: (id: number, data: any) =>
    request(`/media/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteMedia: (id: number) =>
    request(`/media/${id}`, { method: 'DELETE' }),

  // Microorganisms
  getMicroorganisms: () => request('/microorganisms'),

  createMicroorganism: (data: any) =>
    request('/microorganisms', { method: 'POST', body: JSON.stringify(data) }),

  updateMicroorganism: (id: number, data: any) =>
    request(`/microorganisms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteMicroorganism: (id: number) =>
    request(`/microorganisms/${id}`, { method: 'DELETE' }),

  // Shift Reports
  getShiftReports: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/reports${qs}`);
  },

  getShiftReport: (id: number) => request(`/reports/${id}`),

  createShiftReport: (data: any) =>
    request('/reports', { method: 'POST', body: JSON.stringify(data) }),

  updateShiftReport: (id: number, data: any) =>
    request(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteShiftReport: (id: number) =>
    request(`/reports/${id}`, { method: 'DELETE' }),

  generateReportPdf: (id: number) => request(`/reports/${id}/pdf`),

  // Search
  search: (q: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/search?q=${encodeURIComponent(q)}${qs}`);
  },

  // Dashboard stats
  getDashboardStats: () => request('/dashboard/stats'),

  getRecentActivity: () => request('/dashboard/activity'),

  // Settings
  getSettings: () => request('/settings'),

  updateSetting: (key: string, value: string) =>
    request('/settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    }),

  getSpecifications: () => request('/settings/specifications'),

  createSpecification: (data: any) =>
    request('/settings/specifications', { method: 'POST', body: JSON.stringify(data) }),

  updateSpecification: (id: number, data: any) =>
    request(`/settings/specifications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteSpecification: (id: number) =>
    request(`/settings/specifications/${id}`, { method: 'DELETE' }),

  getSopReferences: () => request('/settings/sops'),

  createSopReference: (data: any) =>
    request('/settings/sops', { method: 'POST', body: JSON.stringify(data) }),

  updateSopReference: (id: number, data: any) =>
    request(`/settings/sops/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteSopReference: (id: number) =>
    request(`/settings/sops/${id}`, { method: 'DELETE' }),

  // Audit
  getAuditLogs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/audit${qs}`);
  },
};
