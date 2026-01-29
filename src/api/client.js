const API_URL =
  import.meta.env.VITE_LOCAL_API_BASE_URL
 

async function api(path, { method = "GET", body, headers: customHeaders } = {}) {
  const token = localStorage.getItem("token");

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders || {}),
  };

  // ✅ Only set JSON content-type when body is plain JSON
  if (!isFormData && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormData
        ? body
        : JSON.stringify(body),
  });

  if (!res.ok) {
  const payload = await res.json().catch(() => ({}));

  const err = new Error(payload.message || `HTTP ${res.status}`);
  err.status = res.status;
  err.payload = payload;
  err.url = `${API_URL}${path}`;
  throw err;
}

  // handle empty responses (204 etc.)
  if (res.status === 204) return null;

  return res.json();
}

export const apiClient = {
  get: (p) => api(p),
  post: (p, b, opts) => api(p, { method: "POST", body: b, ...(opts || {}) }),
  put: (p, b, opts) => api(p, { method: "PUT", body: b, ...(opts || {}) }),
  patch: (p, b, opts) => api(p, { method: "PATCH", body: b, ...(opts || {}) }),
  del: (p, b, opts) => api(p, { method: "DELETE", body: b, ...(opts || {}) }),
};
