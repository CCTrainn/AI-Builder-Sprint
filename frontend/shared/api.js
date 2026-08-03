const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("cctrainn_token");
  const headers = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json();

  if (!response.ok || body.success === false) {
    if (response.status === 401) {
      localStorage.removeItem("cctrainn_token");
      localStorage.removeItem("cctrainn_email");
    }
    throw new Error(body.error?.message || body.detail || "요청을 처리하지 못했습니다.");
  }

  return body.data;
}
