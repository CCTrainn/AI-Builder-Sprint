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
    await apiRequest("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    window.location.href = "./login.html";
  } catch (error) {
    errorMsg.textContent = error.message || "회원가입에 실패했습니다.";
    errorMsg.hidden = false;
  }
});
