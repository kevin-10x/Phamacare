// Central API client. Set VITE_API_URL in a .env file (or Cloudflare Pages
// environment variable) to point at your deployed Worker, e.g.
// VITE_API_URL=https://pharmacare-api.<your-subdomain>.workers.dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('pharmacare_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...authHeaders(),
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || 'Request failed');
  return data;
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: any) =>
    request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (path: string, body?: any) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path: string) => request(path, { method: 'DELETE' }),
};
