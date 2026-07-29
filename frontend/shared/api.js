const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const body = await response.json();

  if (!response.ok || body.success === false) {
    throw new Error(body.error?.message || "요청을 처리하지 못했습니다.");
  }

  return body.data;
}

