import { mountThemeToggle } from "./theme.js?v=20260803-6";

const sidebarRoot = document.querySelector("#appSidebar");
const DISPLAY_LANGUAGES = [
  { value: "ko", label: "Korean" },
  { value: "vi", label: "Vietnamese" },
  { value: "zh-CN", label: "Chinese" },
  { value: "th", label: "Thai" },
  { value: "id", label: "Indonesian" },
  { value: "en", label: "English" },
];

function readDisplayLanguage() {
  const requested = new URLSearchParams(window.location.search).get("language");
  const stored = window.sessionStorage.getItem("site_display_language_v2");
  return DISPLAY_LANGUAGES.some(({ value }) => value === requested)
    ? requested
    : DISPLAY_LANGUAGES.some(({ value }) => value === stored) ? stored : "ko";
}

function languageOptions(selected) {
  return DISPLAY_LANGUAGES.map(({ value, label }) => (
    `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`
  )).join("");
}

function languageMenuItems(selected) {
  return DISPLAY_LANGUAGES.map(({ value, label }) => `
    <button class="language-menu__item${value === selected ? " is-selected" : ""}"
      type="button" role="option" aria-selected="${value === selected}" data-language="${value}">
      <span>${label}</span><span class="language-menu__check" aria-hidden="true">✓</span>
    </button>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character]);
}

const NAV_ITEMS = [
  {
    id: "home",
    label: "홈",
    mobileLabel: "홈",
    href: "../home/home.html",
    icon: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  },
  {
    id: "records",
    label: "자료 모으기",
    mobileLabel: "자료",
    href: "../records/records.html",
    icon: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.2 10H20a2 2 0 0 1 1.9 2.5l-1.5 6a2 2 0 0 1-2 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.7.9l.8 1.2A2 2 0 0 0 12.1 6H18a2 2 0 0 1 2 2v2"/>',
  },
  {
    id: "comparison",
    label: "조건 비교하기",
    mobileLabel: "비교",
    href: "../comparison/comparison.html",
    icon: '<path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0l3-8ZM5 8l3 8a5 5 0 0 1-6 0l3-8Z"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1M7 21h10"/>',
  },
  {
    id: "conversation",
    label: "대꾸 AI",
    mobileLabel: "대꾸 AI",
    href: "../conversation/conversation.html",
    icon: '<path d="M16 10a2 2 0 0 1-2 2H6.8a2 2 0 0 0-1.4.6l-2.2 2.2A.7.7 0 0 1 2 14.3V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/><path d="M20 9a2 2 0 0 1 2 2v10.3a.7.7 0 0 1-1.2.5l-2.2-2.2a2 2 0 0 0-1.4-.6H10a2 2 0 0 1-2-2v-1"/>',
  },
  {
    id: "record_box",
    label: "내 기록",
    mobileLabel: "기록함",
    href: "../record_box/record-box.html",
    icon: '<path d="M12 5v16"/><path d="M20 19a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4a5 5 0 0 0-4 2 5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4a5 5 0 0 1 4 2 5 5 0 0 1 4-2Z"/>',
  },
  {
    id: "community",
    label: "공동 경험",
    mobileLabel: "경험",
    href: "../community/community.html",
    icon: '<circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="m7 7 3 3m4 0 3-3m-7 7-3 3m7-3 3 3"/>',
  },
];

function renderSidebar() {
  if (!sidebarRoot) return;

  const activePage = document.body.dataset.page || "";
  const displayLanguage = readDisplayLanguage();
  const navigation = NAV_ITEMS.map((item) => {
    const isActive = item.id === activePage;
    return `
      <a
        class="app-sidebar__item${isActive ? " is-active" : ""}"
        href="${item.href}"
        title="${item.label}"
        ${isActive ? 'aria-current="page"' : ""}
      >
        <svg class="app-sidebar__icon" aria-hidden="true" viewBox="0 0 24 24">${item.icon}</svg>
        <span class="app-sidebar__label">${item.label}</span>
        <span class="app-sidebar__mobile-label">${item.mobileLabel}</span>
      </a>
    `;
  }).join("");
  const userEmail = window.localStorage.getItem("cctrainn_email");
  const shortName = userEmail ? userEmail.split("@")[0] : "";
  const accountContent = userEmail
    ? `<strong>${escapeHtml(shortName)}</strong><button id="logout-btn" type="button">로그아웃</button>`
    : '<a href="../auth/login.html">로그인 / 회원가입</a>';
  const avatarText = userEmail ? escapeHtml(shortName.charAt(0).toUpperCase()) : "?";

  sidebarRoot.innerHTML = `
    <aside class="app-sidebar" aria-label="앱 사이드바">
      <a class="app-sidebar__brand" href="../home/home.html" aria-label="근로권리 동반자 홈">
        <img class="app-sidebar__brand-logo app-sidebar__brand-logo--light"
          src="../../shared/logo-black.png" alt="" aria-hidden="true">
        <img class="app-sidebar__brand-logo app-sidebar__brand-logo--dark"
          src="../../shared/logo-white.png" alt="" aria-hidden="true">
      </a>

      <nav class="app-sidebar__nav" aria-label="주요 메뉴">
        ${navigation}
      </nav>

      <div class="app-sidebar__footer">
        <div class="app-sidebar__workspace">
          <span class="app-sidebar__avatar" aria-hidden="true">${avatarText}</span>
          <span class="app-sidebar__workspace-copy">
            ${accountContent}
          </span>
        </div>
        <div class="app-sidebar__controls" aria-label="화면 설정">
          <div class="app-sidebar__language-picker">
            <button id="language-menu-toggle" class="language-menu__toggle" type="button"
              aria-label="Select language" aria-haspopup="listbox" aria-expanded="false">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"></path>
            </svg>
            </button>
            <select id="site-language" aria-label="Site display language" tabindex="-1" hidden>
              ${languageOptions(displayLanguage)}
            </select>
            <div id="language-menu" class="language-menu" role="listbox" aria-label="Select language" hidden>
              <strong>Language</strong>
              ${languageMenuItems(displayLanguage)}
            </div>
          </div>
        </div>
      </div>
    </aside>
  `;

  document.querySelector("#logout-btn")?.addEventListener("click", () => {
    window.localStorage.removeItem("cctrainn_token");
    window.localStorage.removeItem("cctrainn_email");
    window.location.reload();
  });
}

renderSidebar();
mountThemeToggle();
import("./site-i18n.js?v=20260803-12");

const siteLanguage = document.querySelector("#site-language");
const languageMenuToggle = document.querySelector("#language-menu-toggle");
const languageMenu = document.querySelector("#language-menu");

function closeLanguageMenu() {
  languageMenu.hidden = true;
  languageMenuToggle.setAttribute("aria-expanded", "false");
}

languageMenuToggle?.addEventListener("click", () => {
  const willOpen = languageMenu.hidden;
  languageMenu.hidden = !willOpen;
  languageMenuToggle.setAttribute("aria-expanded", String(willOpen));
  if (willOpen) languageMenu.querySelector(".is-selected")?.focus();
});

languageMenu?.addEventListener("click", (event) => {
  const item = event.target.closest("[data-language]");
  if (!item) return;
  siteLanguage.value = item.dataset.language;
  siteLanguage.dispatchEvent(new Event("change", { bubbles: true }));
  languageMenu.querySelectorAll("[data-language]").forEach((button) => {
    const selected = button.dataset.language === siteLanguage.value;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  closeLanguageMenu();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".app-sidebar__language-picker")) closeLanguageMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !languageMenu.hidden) {
    closeLanguageMenu();
    languageMenuToggle.focus();
  }
});

if (siteLanguage) {
  siteLanguage.addEventListener("change", () => {
    window.sessionStorage.setItem("site_display_language_v2", siteLanguage.value);
    window.sessionStorage.setItem("user_language", siteLanguage.value);
    document.dispatchEvent(new CustomEvent("userlanguagechange", {
      detail: { language: siteLanguage.value },
    }));
  });
}
