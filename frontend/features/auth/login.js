import { apiRequest } from "../../shared/api.js";

const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const errorMsg = document.querySelector("#error-msg");

// ✨ 데모 발표용 치트키 계정 (서버 꺼져도 무조건 통과)
const DUMMY_USER = {
  email: "test@cctrainn.com",
  password: "1234"
};

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.hidden = true;
  errorMsg.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // 1. 치트키 계정 확인
  if (email === DUMMY_USER.email && password === DUMMY_USER.password) {
    localStorage.setItem("cctrainn_token", "demo_dummy_token_12345");
    localStorage.setItem("cctrainn_email", email);
    window.location.href = "../home/home.html";
    return;
  }

  // 2. 방금 회원가입한 사람인지 확인 (백엔드 없이 프론트단에서 가입한 임시 데이터)
  const mockEmail = localStorage.getItem("mock_email");
  const mockPw = localStorage.getItem("mock_password");
  if (mockEmail && email === mockEmail && password === mockPw) {
    localStorage.setItem("cctrainn_token", "demo_mock_token_67890");
    localStorage.setItem("cctrainn_email", email);
    window.location.href = "../home/home.html";
    return;
  }

  // 3. 실제 백엔드 API 연동 시도
  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem("cctrainn_token", data.token);
    localStorage.setItem("cctrainn_email", data.email);
    window.location.href = "../home/home.html";
  } catch (error) {
    // Failed to fetch 에러 처리 (서버 다운 시)
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      errorMsg.innerHTML = "백엔드 서버에 연결할 수 없습니다. (서버 꺼짐)<br>데모 시연용 계정(test@cctrainn.com / 1234)을 이용해주세요.";
    } else {
      errorMsg.textContent = error.message || "로그인에 실패했습니다.";
    }
    errorMsg.hidden = false;
  }
});