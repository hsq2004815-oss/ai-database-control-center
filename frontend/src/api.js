const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8876";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => null);
  if (!payload || payload.ok === false) {
    const message = payload?.error?.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return payload.data;
}

export const api = {
  health: () => request("/health"),
  domains: () => request("/domains"),
  domainStatus: (domain) => request(`/domains/${encodeURIComponent(domain)}/status`),
  search: ({ domain, q, limit }) =>
    request(`/search?domain=${encodeURIComponent(domain)}&q=${encodeURIComponent(q)}&limit=${limit}`),
  brief: (payload) => request("/brief", { method: "POST", body: JSON.stringify(payload) }),
  reports: (domain) => request(`/reports?domain=${encodeURIComponent(domain)}`),
  reportContent: (domain, name) => request(`/reports/${encodeURIComponent(domain)}/${encodeURIComponent(name)}`),
  backendFiles: (type) => request(`/backend/files?type=${encodeURIComponent(type)}`)
};
