// Order: 1) build-time env (VITE_API_BASE_URL)  2) in dev use same-origin
// (Vite proxies /api → the API server)  3) in a prod build with no env,
// fall back to the public API URL (it is a public URL, not a secret).
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '' : 'https://civiccare-api.onrender.com');

function authHeader(kind) {
  const token = localStorage.getItem(kind === 'authority' ? 'cc_auth_token' : 'cc_token');
  return token ? { Authorization: 'Bearer ' + token } : {};
}

async function parseBody(res) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* not json */
  }
  return body;
}

async function request(path, { method = 'GET', body, kind = 'user' } = {}) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader(kind) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await parseBody(res);
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
}

// ---------------- public ----------------
export const health = () => request('/api/health');

// ---------------- citizen auth ----------------
export const signup = (name, email, password) =>
  request('/api/auth/signup', { method: 'POST', body: { name, email, password } });
export const login = (email, password) =>
  request('/api/auth/login', { method: 'POST', body: { email, password } });
export const sendOtp = (phone) => request('/api/auth/otp/send', { method: 'POST', body: { phone } });
export const verifyOtp = (phone, otp) =>
  request('/api/auth/otp/verify', { method: 'POST', body: { phone, otp } });
export const me = () => request('/api/me');

// ---------------- complaints (citizen) ----------------
export const listComplaints = () => request('/api/complaints');
export const getComplaint = (id) => request(`/api/complaints/${id}`);
export const createComplaint = (data) => request('/api/complaints', { method: 'POST', body: data });
export const updateComplaint = (id, data) => request(`/api/complaints/${id}`, { method: 'PUT', body: data });
export const deleteComplaint = (id) => request(`/api/complaints/${id}`, { method: 'DELETE' });

// ---------------- AI ----------------
export const aiAnalyze = (image, text) => request('/api/ai/analyze', { method: 'POST', body: { image, text } });
export const aiImprove = (text) => request('/api/ai/improve', { method: 'POST', body: { text } });

// ---------------- authority ----------------
export const authorityLogin = (phone, password) =>
  request('/api/authority/login', { method: 'POST', body: { phone, password }, kind: 'authority' });
export const authorityMe = () => request('/api/authority/me', { kind: 'authority' });
export const authorityComplaints = (status) =>
  request('/api/authority/complaints' + (status && status !== 'all' ? `?status=${status}` : ''), { kind: 'authority' });
export const authorityComplaint = (id) => request(`/api/authority/complaints/${id}`, { kind: 'authority' });
export const authorityAction = (id, action, message) =>
  request(`/api/authority/complaints/${id}/action`, { method: 'POST', body: { action, message }, kind: 'authority' });
export const authorityComplete = (id, afterImage, message) =>
  request(`/api/authority/complaints/${id}/complete`, { method: 'POST', body: { afterImage, message }, kind: 'authority' });
export const authorityNote = (id, message) =>
  request(`/api/authority/complaints/${id}/note`, { method: 'POST', body: { message }, kind: 'authority' });
