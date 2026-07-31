const sidebarRoot = document.querySelector("#appSidebar");

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
    label: "대화 도우미",
    mobileLabel: "대화",
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
];

function renderSidebar() {
  if (!sidebarRoot) return;

  const activePage = document.body.dataset.page || "";
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

  sidebarRoot.innerHTML = `
    <aside class="app-sidebar" aria-label="앱 사이드바">
      <a class="app-sidebar__brand" href="../home/home.html" aria-label="근로권리 동반자 홈">
        <span class="app-sidebar__brand-mark" aria-hidden="true">로고</span>
        <span class="app-sidebar__brand-copy">
          <strong>ㄱㄹㄱㄹ</strong>
        </span>
      </a>

      <nav class="app-sidebar__nav" aria-label="주요 메뉴">
        ${navigation}
      </nav>

      <div class="app-sidebar__workspace">
        <span class="app-sidebar__avatar" aria-hidden="true">프사</span>
        <span class="app-sidebar__workspace-copy">
          <strong>이름</strong>
        </span>
      </div>
    </aside>
  `;
}

renderSidebar();

