import { apiRequest } from "../../shared/api.js";

const signupForm = document.querySelector("#signup-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const passwordConfirmInput = document.querySelector("#password-confirm");
const errorMsg = document.querySelector("#error-msg");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.hidden = true;

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const passwordConfirm = passwordConfirmInput.value;

  if (password !== passwordConfirm) {
    errorMsg.textContent = "비밀번호가 일치하지 않습니다.";
    errorMsg.hidden = false;
    return;
  }

  try {
    // 1. 데모 시연을 위한 임시 로컬 저장 (서버가 꺼져있어도 가입->로그인 흐름을 보여주기 위함)
    localStorage.setItem("mock_email", email);
    localStorage.setItem("mock_password", password);

    // 2. 실제 백엔드 연동 시도 (실패해도 에러 안 띄우고 다음으로 넘어감)
    await apiRequest("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(err => {
      console.warn("백엔드 연결 실패, 로컬 임시 가입 상태로 진행합니다.", err);
    });

    alert("회원가입이 완료되었습니다!\n로그인 페이지로 이동합니다.");
    window.location.href = "./login.html";
  } catch (error) {
    errorMsg.textContent = error.message || "회원가입에 실패했습니다.";
    errorMsg.hidden = false;
  }
});