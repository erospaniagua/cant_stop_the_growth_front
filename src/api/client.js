const API_URL =
  import.meta.env.LOCAL_API_BASE_URL || "http://localhost:5000";

async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const apiClient = {
  get: (p) => api(p),
  post: (p, b) => api(p, { method: "POST", body: b }),
  put: (p, b) => api(p, { method: "PUT", body: b }),
  patch: (p, b) => api(p, { method: "PATCH", body: b }),

  // 🔥 FIX: allow DELETE with body
  del: (p, b) => api(p, { method: "DELETE", body: b }),
};
