const BASE = 'http://localhost:3001';
const req = (path, opts = {}) =>
  fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  }).then(r => r.json());

// Generic authenticated API helper used by WaiversPage and others
export const api = (path, opts = {}) => req(path, opts);

export const login = (password) => req('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
export const logout = () => req('/api/admin/logout', { method: 'POST' });
export const checkAuth = () => req('/api/admin/me');
export const getDashboard = (params = {}) => {
  const qs = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';
  return req(`/api/admin/dashboard${qs}`);
};
export const getBookings = (params = '') => req(`/api/admin/bookings${params}`);
export const updateBooking = (id, data) => req(`/api/admin/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const getGiftCards = (params = '') => req(`/api/admin/gift-cards${params}`);
export const updateGiftCard = (id, data) => req(`/api/admin/gift-cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const issueGiftCard = (data) => req('/api/admin/gift-cards/issue', { method: 'POST', body: JSON.stringify(data) });
export const getClients = (params = '') => req(`/api/admin/clients${params}`);
export const getClient = (id) => req(`/api/admin/clients/${id}`);
export const getEnquiries = (params = '') => req(`/api/admin/enquiries${params}`);
export const updateEnquiry = (id, data) => req(`/api/admin/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const getConfig = () => req('/api/admin/config');
export const updateConfig = (data) => req('/api/admin/config', { method: 'PUT', body: JSON.stringify(data) });

export async function exportBookings() {
  const res = await fetch('http://localhost:3001/api/admin/bookings/export', { credentials: 'include' });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'bookings.csv'; a.click();
  URL.revokeObjectURL(url);
}

export const updateClient = (id, data) => req(`/api/admin/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const resendGiftCard = (id) => req(`/api/admin/gift-cards/${id}/resend`, { method: 'POST' });
