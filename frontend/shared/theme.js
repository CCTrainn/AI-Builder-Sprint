const THEME_STORAGE_KEY = "work_rights_theme_v1";
const DARK_THEME = "dark";
const LIGHT_THEME = "light";
const root = document.documentElement;
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function ensureThemeStylesheet() {
  if (document.querySelector("#app-theme-stylesheet")) return;

  const stylesheet = document.createElement("link");
  stylesheet.id = "app-theme-stylesheet";
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("./theme.css?v=20260803-4", import.meta.url).href;
  document.head.append(stylesheet);
}

function storedTheme() {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === DARK_THEME || value === LIGHT_THEME ? value : null;
  } catch {
    return null;
  }
}

function preferredTheme() {
  return storedTheme() || (systemTheme.matches ? DARK_THEME : LIGHT_THEME);
}

function updateToggle(button, theme) {
  if (!button) return;

  const isDark = theme === DARK_THEME;
  const label = isDark ? "라이트 모드로 전환" : "다크 모드로 전환";
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", String(isDark));
  button.title = label;
  button.querySelector(".theme-toggle__moon")?.toggleAttribute("hidden", isDark);
  button.querySelector(".theme-toggle__sun")?.toggleAttribute("hidden", !isDark);
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  updateToggle(document.querySelector("#theme-toggle"), theme);
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 저장소를 사용할 수 없어도 현재 페이지의 테마 전환은 유지한다.
  }
}

ensureThemeStylesheet();
applyTheme(preferredTheme());

export function mountThemeToggle() {
  const sidebar = document.querySelector(".app-sidebar");
  if (!sidebar || document.querySelector("#theme-toggle")) return;

  const button = document.createElement("button");
  button.id = "theme-toggle";
  button.className = "theme-toggle";
  button.type = "button";
  button.innerHTML = `
    <svg class="theme-toggle__moon" aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20.4 15.2A8 8 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z"></path>
    </svg>
    <svg class="theme-toggle__sun" aria-hidden="true" viewBox="0 0 24 24" hidden>
      <circle cx="12" cy="12" r="3.5"></circle>
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>
    </svg>
  `;
  const controls = sidebar.querySelector(".app-sidebar__controls");
  (controls || sidebar.parentElement).append(button);
  updateToggle(button, root.dataset.theme);

  button.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    saveTheme(nextTheme);
    applyTheme(nextTheme);
  });
}

systemTheme.addEventListener("change", (event) => {
  if (!storedTheme()) applyTheme(event.matches ? DARK_THEME : LIGHT_THEME);
});
