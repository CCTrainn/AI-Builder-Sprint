import { apiRequest } from "../../shared/api.js";

const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const errorMsg = document.querySelector("#error-msg");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.hidden = true;
  errorMsg.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

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
    errorMsg.textContent = error.message || "로그인에 실패했습니다.";
    errorMsg.hidden = false;
  }
});
