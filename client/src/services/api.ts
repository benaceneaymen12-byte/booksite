const API_BASE = import.meta.env.VITE_API_URL || '/api';

function normalizeShiftReport(report: any): any {
  if (!report) return report;

  return {
    ...report,
    shiftStart: report.shiftStart ?? report.shift_start ?? '',
    shiftEnd: report.shiftEnd ?? report.shift_end ?? '',
    shiftLabel: report.shiftLabel ?? report.shift_label ?? (
      report.shiftStart || report.shift_start
        ? `${report.shiftStart ?? report.shift_start} - ${report.shiftEnd ?? report.shift_end}`
        : ''
    ),
    activities: Array.isArray(report.activities)
      ? report.activities
      : Array.isArray(report.activities_json)
        ? report.activities_json
        : typeof report.activities_json === 'string'
          ? JSON.parse(report.activities_json || '[]')
          : [],
  };
}

function normalizeMedia(item: any): any {
  if (!item) return item;

  return {
    ...item,
    mediumName: item.mediumName ?? item.medium_name ?? '',
    lotNumber: item.lotNumber ?? item.lot_number ?? '',
    preparationDate: item.preparationDate ?? item.preparation_date ?? '',
    sterilizationDate: item.sterilizationDate ?? item.sterilization_date ?? '',
    sterilizationMethod: item.sterilizationMethod ?? item.sterilization_method ?? '',
    quantityPrepared: item.quantityPrepared ?? item.quantity_prepared,
    quantityUsed: item.quantityUsed ?? item.quantity_used,
    quantityRemaining: item.quantityRemaining ?? item.quantity_remaining,
    expiryDate: item.expiryDate ?? item.expiry_date ?? '',
    storageConditions: item.storageConditions ?? item.storage_conditions ?? '',
    preparedBy: item.preparedBy ?? item.prepared_by ?? '',
    volume: item.volume ?? '',
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
    isDemo: item.isDemo ?? !!item.is_demo,
  };
}

function normalizePetri(item: any): any {
  if (!item) return item;
  return {
    ...item,
    mediaId: item.mediaId ?? item.media_id,
    mediumName: item.mediumName ?? item.medium_name ?? '',
    lotNumber: item.lotNumber ?? item.lot_number ?? '',
    preparationDate: item.preparationDate ?? item.preparation_date ?? '',
    expiryDate: item.expiryDate ?? item.expiry_date ?? '',
    quantityPrepared: item.quantityPrepared ?? item.quantity_prepared,
    quantityUsed: item.quantityUsed ?? item.quantity_used,
    quantityRemaining: item.quantityRemaining ?? item.quantity_remaining,
    preparedBy: item.preparedBy ?? item.prepared_by ?? '',
    createdAt: item.createdAt ?? item.created_at,
  };
}

function normalizeSopReference(item: any): any {
  if (!item) return item;
  return {
    ...item,
    refCode: item.refCode ?? item.ref_code ?? '',
    createdAt: item.createdAt ?? item.created_at,
  };
}

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
    return request(`/media${qs}`).then((rows) => (rows || []).map(normalizeMedia));
  },

  getMediaItem: (id: number) => request(`/media/${id}`).then(normalizeMedia),

  createMedia: (data: any) =>
    request('/media', { method: 'POST', body: JSON.stringify(data) }).then(normalizeMedia),

  updateMedia: (id: number, data: any) =>
    request(`/media/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(normalizeMedia),

  deleteMedia: (id: number) =>
    request(`/media/${id}`, { method: 'DELETE' }),

  // Pre-poured Petri dishes
  getPetri: () => request('/petri').then((rows) => (rows || []).map(normalizePetri)),
  createPetri: (data: any) =>
    request('/petri', { method: 'POST', body: JSON.stringify(data) }).then(normalizePetri),
  deletePetri: (id: number) =>
    request(`/petri/${id}`, { method: 'DELETE' }),

  getInventory: () => request('/inventory'),
  createInventory: (data: any) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  importInventory: (rows: any[]) => request('/inventory/import', { method: 'POST', body: JSON.stringify({ rows }) }),
  deleteInventory: (id: number) => request(`/inventory/${id}`, { method: 'DELETE' }),
  getSterilization: () => request('/sterilization'),
  createSterilization: (data: any) => request('/sterilization', { method: 'POST', body: JSON.stringify(data) }),
  exportBackup: () => request('/backup'),
  restoreBackup: (backup: any) => request('/restore', { method: 'POST', body: JSON.stringify(backup) }),

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
    return request(`/reports${qs}`).then((rows) => (rows || []).map(normalizeShiftReport));
  },

  getShiftReport: (id: number) => request(`/reports/${id}`).then(normalizeShiftReport),

  createShiftReport: (data: any) =>
    request('/reports', { method: 'POST', body: JSON.stringify(data) }).then(normalizeShiftReport),

  updateShiftReport: (id: number, data: any) =>
    request(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(normalizeShiftReport),

  deleteShiftReport: (id: number) =>
    request(`/reports/${id}`, { method: 'DELETE' }),

  generateReportPdf: async (id: number) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/reports/${id}/pdf`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `HTTP ${res.status}`);
    }

    return res.text();
  },

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

  getSopReferences: () => request('/settings/sops').then((rows) => (rows || []).map(normalizeSopReference)),

  createSopReference: (data: any) =>
    request('/settings/sops', { method: 'POST', body: JSON.stringify(data) }).then(normalizeSopReference),

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
