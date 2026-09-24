// Tiny API helper.
// Local dev: BASE is empty → requests go to /api → Vite proxies them to Express (port 4000).
// Production: VITE_API_BASE_URL is your Render API URL (baked in at build time).
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function token() {
  return localStorage.getItem('cc_token') || null;
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}
