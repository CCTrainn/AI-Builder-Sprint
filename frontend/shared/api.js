const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function apiRequest(path, options = {}) {
  // ✨ 로컬 스토리지에서 로그인 토큰 꺼내기
  const token = localStorage.getItem("cctrainn_token");
  const headers = { ...options.headers };

  // 토큰이 존재하면 헤더에 장착
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json();

  if (!response.ok || body.success === false) {
    // ✨ 토큰 만료 또는 인증 에러(401) 발생 시 강제 로그아웃 처리
    if (response.status === 401) {
      localStorage.removeItem("cctrainn_token");
      localStorage.removeItem("cctrainn_email");
      window.location.href = "../home/home.html"; // 향후 login.html로 변경
    }
    throw new Error(body.error?.message || "요청을 처리하지 못했습니다.");
  }

  return body.data;
}