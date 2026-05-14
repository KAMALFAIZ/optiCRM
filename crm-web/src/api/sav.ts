import axios from 'axios';

const API_BASE = '/api/v1/sav';

// ── Auth portail ───────────────────────────────────────────────────────────

export const savAuthApi = {
  requestOtp: (telWhatsapp: string) =>
    axios.post(`${API_BASE}/portal/auth/request-otp`, { tel_whatsapp: telWhatsapp }),

  verifyOtp: (telWhatsapp: string, otp: string) =>
    axios.post(`${API_BASE}/portal/auth/verify-otp`, { tel_whatsapp: telWhatsapp, otp }),
};

// ── Portail client ─────────────────────────────────────────────────────────

function savPortalClient(token: string) {
  return axios.create({
    baseURL: `${API_BASE}/portal`,
    headers: { 'X-SAV-Token': token },
  });
}

export const savPortalApi = {
  submitTicket: (token: string, texte: string, canal = 'WEB') =>
    savPortalClient(token).post('/tickets', { texte, canal }),

  getTicket: (token: string, numero: string) =>
    savPortalClient(token).get(`/tickets/${numero}`),

  getMyTickets: (token: string) =>
    savPortalClient(token).get('/tickets'),

  confirmResolution: (token: string, numero: string, resolved: boolean) =>
    savPortalClient(token).post(`/tickets/${numero}/confirm`, { resolved }),
};

// ── Dashboard KASOFT ───────────────────────────────────────────────────────

import client from './client'; // axios instance avec auth OptiCRM

export const savDashboardApi = {
  getStats: () => client.get(`${API_BASE}/dashboard/stats`),
  getTickets: (limit = 50) => client.get(`${API_BASE}/dashboard/tickets?limit=${limit}`),
  getTicketDetail: (id: string) => client.get(`${API_BASE}/dashboard/tickets/${id}`),
  replyToTicket: (id: string, contenu: string, langue = 'FR') =>
    client.post(`${API_BASE}/dashboard/tickets/${id}/reply`, { contenu, langue }),
  resolveTicket: (id: string, notes?: string) =>
    client.post(`${API_BASE}/dashboard/tickets/${id}/resolve`, { notes }),
  getEscalades: () => client.get(`${API_BASE}/dashboard/escalades`),
  prendreEnCharge: (id: string) =>
    client.post(`${API_BASE}/dashboard/escalades/${id}/prendre-en-charge`),
};

// ── Knowledge Base ─────────────────────────────────────────────────────────

export const savKbApi = {
  listArticles: (categorie?: string, actifSeulement = false) =>
    client.get(`${API_BASE}/kb`, { params: { categorie, actifSeulement } }),
  getArticle: (id: string) => client.get(`${API_BASE}/kb/${id}`),
  createArticle: (article: Record<string, unknown>) => client.post(`${API_BASE}/kb`, article),
  updateArticle: (id: string, article: Record<string, unknown>) => client.put(`${API_BASE}/kb/${id}`, article),
  validerArticle: (id: string) => client.post(`${API_BASE}/kb/${id}/valider`),
  deactivateArticle: (id: string) => client.delete(`${API_BASE}/kb/${id}`),
  regenererEmbedding: (id: string) => client.post(`${API_BASE}/kb/${id}/regenerer-embedding`),
  search: (q: string) => client.get(`${API_BASE}/kb/search`, { params: { q } }),
};
