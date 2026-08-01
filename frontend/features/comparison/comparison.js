const params = new URLSearchParams(window.location.search);
const requestedWorkplaceId = params.get("workplace_id");
const storedWorkplaceId = readSessionValue("workplace_id");
const workplaceId = requestedWorkplaceId || storedWorkplaceId || "demo-e2e";
const useMockData = params.get("mode") === "mock";
const forcedState = params.get("state");
const API_BASE = resolveApiBase();

writeSessionValue("workplace_id", workplaceId);

const CONDITION_META = {
  hourly_wage: { label: "시간급", description: "약속·계약·급여 계산 기준" },
  working_hours: { label: "근로시간", description: "주 단위 근로시간" },
  pay_date: { label: "급여일", description: "급여 지급 예정일과 실제 기록" },
  probation: { label: "수습기간", description: "수습 적용 여부와 기간" },
  weekly_holiday_pay: { label: "주휴수당", description: "기록에 표시된 주휴수당 조건" },
  weekly_working_hours: { label: "주 근로시간", description: "주 40시간과 연장근로 확인" },
  total_working_hours: { label: "월 총 근로시간", description: "급여 계산에 사용된 시간" },
  overtime_hours: { label: "가산 근로시간", description: "연장·야간·휴일근로 기록" },
  break_time: { label: "휴게시간", description: "근로시간에 필요한 최소 휴게" },
  basic_pay: { label: "기본급", description: "급여명세서 기본급" },
  gross_pay: { label: "지급액 합계", description: "근로시간으로 계산한 예상액과 비교" },
  deductions: { label: "공제액", description: "급여에서 빠진 금액" },
  net_pay: { label: "실수령액", description: "명세서와 실제 입금액" },
};

const STATUS_META = {
  different: { label: "기록이 다름", className: "different" },
  needs_confirmation: { label: "확인 필요", className: "needs_confirmation" },
  missing: { label: "자료 부족", className: "missing" },
  same: { label: "기록이 같음", className: "same" },
};

const RIGHTS_STATUS_META = {
  standard_mismatch: { label: "기준과 기록이 다름", className: "standard_mismatch" },
  needs_confirmation: { label: "추가 확인 필요", className: "needs_confirmation" },
  insufficient_information: { label: "판단 자료 부족", className: "insufficient_information" },
  no_mismatch_detected: { label: "수치 차이 없음", className: "no_mismatch_detected" },
};

const SOURCE_NAMES = {
  rec_job: "채용공고",
  rec_contract: "근로계약서",
  rec_payslip: "급여명세서",
  rec_attendance: "출퇴근 기록",
  rec_deposit: "입금내역",
};

const MOCK_COMPARISONS = [
  {
    comparison_id: "cmp_hourly_wage",
    condition: "hourly_wage",
    promised: { value: 12000, unit: "KRW", record_id: "rec_job" },
    contracted: { value: 12000, unit: "KRW", record_id: "rec_contract" },
    actual: { value: 10500, unit: "KRW", record_id: "rec_payslip" },
    status: "different",
    summary: "계약 시급과 급여 계산 시급이 1,500원 다르게 기록되어 있어요.",
    confirmation_items: ["수습기간 적용 여부", "적용 기간", "10,500원의 계산 근거"],
    legal_reference: {
      title: "최저임금법 제6조 (최저임금의 효력)",
      article: "공식 조문 본문",
      source_url: "https://www.law.go.kr/",
      rights_check: {
        status: "no_mismatch_detected",
        rule_code: "minimum_wage_2026",
        title: "최저임금 수치 차이 발견 안 됨",
        explanation: "기록된 시급은 2026년 최저임금 이상입니다.",
        basis: ["기록된 시급: 10,500원", "2026년 적용 최저임금: 10,320원"],
        missing_information: [],
        calculation: null,
      },
    },
  },
  {
    comparison_id: "cmp_working_hours",
    condition: "working_hours",
    promised: { value: 20, unit: "hour", record_id: "rec_job" },
    contracted: { value: 20, unit: "hour", record_id: "rec_contract" },
    actual: { value: 20, unit: "hour", record_id: "rec_attendance" },
    status: "same",
    summary: "주 근로시간이 세 기록에서 모두 20시간으로 같아요.",
    confirmation_items: [],
    legal_reference: {
      title: "근로기준법 근로시간 관련 공식 정보",
      article: null,
      source_url: "https://www.law.go.kr/",
    },
  },
  {
    comparison_id: "cmp_pay_date",
    condition: "pay_date",
    promised: { value: "매월 10일", unit: null, record_id: "rec_job" },
    contracted: { value: "매월 10일", unit: null, record_id: "rec_contract" },
    actual: { value: "8월 10일", unit: null, record_id: "rec_deposit" },
    status: "same",
    summary: "급여일 약속과 실제 입금일 기록이 같은 기준으로 확인돼요.",
    confirmation_items: [],
    legal_reference: {
      title: "근로기준법 임금 지급 관련 공식 정보",
      article: null,
      source_url: "https://www.law.go.kr/",
    },
  },
  {
    comparison_id: "cmp_probation",
    condition: "probation",
    promised: null,
    contracted: { value: "기간·금액 불명확", unit: null, record_id: "rec_contract" },
    actual: { value: "적용됨", unit: null, record_id: "rec_payslip" },
    status: "needs_confirmation",
    summary: "수습 조건의 기간과 적용 금액이 계약 기록에서 명확하지 않아요.",
    confirmation_items: ["수습 시작일과 종료일", "합의한 기록의 위치", "수습기간 중 적용 시급"],
    legal_reference: {
      title: "최저임금법 수습 근로자 관련 공식 정보",
      article: null,
      source_url: "https://www.law.go.kr/",
    },
  },
  {
    comparison_id: "cmp_weekly_holiday_pay",
    condition: "weekly_holiday_pay",
    promised: null,
    contracted: null,
    actual: { value: 0, unit: "KRW", record_id: "rec_payslip" },
    status: "missing",
    summary: "주휴수당 조건을 비교하려면 소정근로일과 출근 기록이 더 필요해요.",
    confirmation_items: ["7월 전체 출퇴근 기록", "주별 소정근로일", "결근 여부"],
    legal_reference: {
      title: "근로기준법 주휴일 관련 공식 정보",
      article: null,
      source_url: "https://www.law.go.kr/",
    },
  },
];

const elements = {
  runButton: document.querySelector("#runComparisonButton"),
  list: document.querySelector("#comparisonList"),
  statePanel: document.querySelector("#comparisonState"),
  tabs: [...document.querySelectorAll("[data-filter]")],
  summaryDescription: document.querySelector("#summaryDescription"),
  differentCount: document.querySelector("#differentCount"),
  confirmationCount: document.querySelector("#confirmationCount"),
  missingCount: document.querySelector("#missingCount"),
  sameCount: document.querySelector("#sameCount"),
  toast: document.querySelector("#toast"),
};

const state = {
  comparisons: [],
  filter: "all",
  toastTimer: null,
};

class ApiRequestError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
  }
}

const FRIENDLY_ERROR_MESSAGES = {
  NETWORK_ERROR: "백엔드에 연결하지 못했어요. API 서버와 CORS 설정을 확인해 주세요.",
  INVALID_WORKPLACE_ID: "사업장 정보 형식이 올바르지 않아요.",
  COMPARISON_LOOKUP_FAILED: "비교할 근무자료를 불러오지 못했어요.",
  COMPARISON_SAVE_FAILED: "비교 결과를 저장하지 못했어요.",
  COMPARISON_NOT_FOUND: "해당 비교 결과를 찾을 수 없어요.",
};

function resolveApiBase() {
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocal) {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }
  return `${window.location.origin}/api/v1`;
}

function readSessionValue(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // 저장소가 제한된 환경에서는 URL의 workplace_id만 사용한다.
  }
}

function preserveRuntimeContext() {
  document.querySelectorAll("a[href]").forEach((anchor) => {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (!url.pathname.includes("/frontend/features/")) return;

    url.searchParams.set("workplace_id", workplaceId);
    if (useMockData) url.searchParams.set("mode", "mock");
    anchor.href = url.href;
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatValue(recordValue) {
  if (!recordValue || recordValue.value === null || recordValue.value === undefined) {
    return "기록 없음";
  }
  if (recordValue.unit === "KRW" && typeof recordValue.value === "number") {
    return `${recordValue.value.toLocaleString("ko-KR")}원`;
  }
  if (recordValue.unit === "hour") return `${recordValue.value}시간`;
  return String(recordValue.value);
}

function renderMetrics() {
  const count = (status) => state.comparisons.filter((item) => item.status === status).length;
  const different = count("different");
  const confirmation = count("needs_confirmation");
  const missing = count("missing");
  const same = count("same");

  elements.differentCount.textContent = different;
  elements.confirmationCount.textContent = confirmation;
  elements.missingCount.textContent = missing;
  elements.sameCount.textContent = same;

  const actionCount = different + confirmation + missing;
  elements.summaryDescription.textContent = actionCount > 0
    ? `확인하거나 자료를 더 모아야 할 조건이 ${actionCount}개 있어요.`
    : "현재 기록에서 추가로 확인할 조건이 없어요.";
}

function renderComparisons() {
  renderMetrics();
  elements.statePanel.replaceChildren();

  if (state.comparisons.length === 0) {
    elements.list.replaceChildren();
    showState("empty");
    return;
  }

  const comparisons = state.filter === "all"
    ? state.comparisons
    : state.comparisons.filter((item) => item.status === state.filter);

  if (comparisons.length === 0) {
    elements.list.replaceChildren();
    showState("filtered-empty");
    return;
  }

  elements.list.innerHTML = comparisons.map(renderComparisonCard).join("");
  preserveRuntimeContext();
}

function renderComparisonCard(comparison) {
  const condition = CONDITION_META[comparison.condition] || {
    label: comparison.condition,
    description: "근로조건 기록",
  };
  const status = STATUS_META[comparison.status] || STATUS_META.needs_confirmation;
  const confirmationItems = Array.isArray(comparison.confirmation_items)
    ? comparison.confirmation_items
    : [];
  const action = renderAction(comparison);
  const rightsCheck = comparison.legal_reference?.rights_check;

  return `
    <article class="comparison-card">
      <header class="comparison-card__header">
        <div class="condition-name">
          <span class="condition-icon">${getConditionIcon(comparison.condition)}</span>
          <span>
            <strong>${escapeHtml(condition.label)}</strong>
            <span>${escapeHtml(condition.description)}</span>
          </span>
        </div>
        <span class="status-badge status-badge--${escapeHtml(status.className)}">${escapeHtml(status.label)}</span>
      </header>

      <div class="value-track">
        ${renderValueCell("약속", "promised", comparison.promised)}
        ${renderValueCell(comparison.condition === "net_pay" ? "명세" : "계약", "contracted", comparison.contracted)}
        ${renderValueCell("실제", "actual", comparison.actual)}
      </div>

      <div class="comparison-card__body">
        <p class="comparison-summary-text">${escapeHtml(comparison.summary)}</p>

        ${rightsCheck ? renderRightsCheck(rightsCheck, comparison.legal_reference) : ""}

        ${confirmationItems.length > 0 ? `
          <div class="confirmation-block">
            <span>${comparison.status === "missing" ? "더 필요한 기록" : "확인할 내용"}</span>
            <ul class="confirmation-list">
              ${confirmationItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}

        ${action ? `<footer class="comparison-card__footer">${action}</footer>` : ""}
      </div>
    </article>
  `;
}

function renderRightsCheck(check, legalReference) {
  const meta = RIGHTS_STATUS_META[check.status] || RIGHTS_STATUS_META.insufficient_information;
  const basis = Array.isArray(check.basis) ? check.basis : [];
  const missing = Array.isArray(check.missing_information) ? check.missing_information : [];
  const calculation = check.calculation;
  return `
    <section class="rights-check rights-check--${escapeHtml(meta.className)}">
      <div class="rights-check__heading">
        <strong>${escapeHtml(check.title)}</strong>
        <span>${escapeHtml(meta.label)}</span>
      </div>
      <p>${escapeHtml(check.explanation)}</p>
      ${calculation ? `
        <div class="pay-calculation">
          <strong>${escapeHtml(calculation.label)}</strong>
          <span>${escapeHtml(calculation.formula)}</span>
          <b>${Number(calculation.expected_amount).toLocaleString("ko-KR")}원</b>
          ${calculation.recorded_amount !== null && calculation.recorded_amount !== undefined
            ? `<small>기록된 금액 ${Number(calculation.recorded_amount).toLocaleString("ko-KR")}원</small>`
            : ""}
          ${(calculation.caveats || []).map((item) => `<small>※ ${escapeHtml(item)}</small>`).join("")}
        </div>
      ` : ""}
      ${basis.length ? `<ul class="rights-basis">${basis.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      ${missing.length ? `<p class="rights-missing">추가 확인: ${escapeHtml(missing.join(" · "))}</p>` : ""}
      ${legalReference?.source_url ? `<a class="law-link" href="${escapeHtml(legalReference.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(legalReference.title || "공식 법령 확인")}</a>` : ""}
    </section>
  `;
}

function renderValueCell(label, className, recordValue) {
  const missingClass = recordValue ? "" : " is-missing";
  const sourceName = recordValue?.record_id
    ? SOURCE_NAMES[recordValue.record_id] || "근무자료"
    : "비교할 자료 필요";

  return `
    <div class="value-cell value-cell--${className}${missingClass}">
      <span>${label}</span>
      <strong>${escapeHtml(formatValue(recordValue))}</strong>
      <small>${escapeHtml(sourceName)}</small>
    </div>
  `;
}

function renderAction(comparison) {
  if (comparison.status === "missing") {
    return '<a class="conversation-link" href="../records/records.html">자료 추가하기</a>';
  }
  const rightsStatus = comparison.legal_reference?.rights_check?.status;
  if (
    comparison.status === "different"
    || comparison.status === "needs_confirmation"
    || ["standard_mismatch", "needs_confirmation"].includes(rightsStatus)
  ) {
    const id = encodeURIComponent(comparison.comparison_id);
    return `<a class="conversation-link" href="../conversation/conversation.html?comparison_id=${id}">대화 도우미</a>`;
  }
  return "";
}

function getConditionIcon(condition) {
  const icons = {
    hourly_wage: '<path d="M12 2v20M17 6.5c-.8-1-2.2-1.5-4-1.5-2.2 0-4 1.2-4 3s1.8 2.7 4 3 4 1.2 4 3-1.8 3-4 3c-1.8 0-3.3-.6-4-1.7"/>',
    working_hours: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pay_date: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    probation: '<path d="M4 19h16M6 19V8l6-4 6 4v11M9 19v-5h6v5"/>',
    weekly_holiday_pay: '<path d="M12 3v18M5 8h14M7 3v5M17 3v5"/><rect x="4" y="5" width="16" height="16" rx="2"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${icons[condition] || icons.pay_date}</svg>`;
}

function showState(type, message = "") {
  const states = {
    loading: {
      title: "근무조건을 비교하고 있어요",
      description: "모아둔 기록을 시간순으로 살펴보고 있어요.",
      loading: true,
    },
    empty: {
      icon: "+",
      title: "비교할 수 있는 기록이 아직 없어요",
      description: "채용공고, 계약서, 급여명세서처럼 서로 비교할 자료를 추가해 주세요.",
      action: "records",
    },
    "filtered-empty": {
      icon: "✓",
      title: "이 상태에 해당하는 조건이 없어요",
      description: "다른 비교 상태를 선택해 보세요.",
    },
    error: {
      icon: "!",
      title: "비교 결과를 불러오지 못했어요",
      description: message || "잠시 후 다시 시도해 주세요. 모아둔 자료는 삭제되지 않았어요.",
      action: "retry",
    },
  };

  const item = states[type];
  if (!item) return;

  elements.statePanel.innerHTML = `
    <div class="state-content">
      ${item.loading ? '<div class="loading-line" aria-hidden="true"></div>' : `<span class="state-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>`}
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.description)}</p>
      ${item.action === "retry" ? '<button class="retry-button" type="button" data-retry>다시 시도하기</button>' : ""}
      ${item.action === "records" ? '<a class="retry-button" href="../records/records.html">자료 추가하기</a>' : ""}
    </div>
  `;
  preserveRuntimeContext();
}

async function fetchJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiRequestError("NETWORK_ERROR", FRIENDLY_ERROR_MESSAGES.NETWORK_ERROR);
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new ApiRequestError(
      result?.error?.code || "UNKNOWN_ERROR",
      result?.error?.message || "요청을 처리하지 못했습니다.",
      response.status,
    );
  }
  return result.data;
}

function getFriendlyError(error, fallback) {
  return FRIENDLY_ERROR_MESSAGES[error?.code] || error?.message || fallback;
}

async function loadComparisons(showCompletionToast = false) {
  elements.runButton.disabled = true;
  elements.runButton.setAttribute("aria-busy", "true");
  elements.list.replaceChildren();
  showState("loading");

  try {
    if (forcedState === "error") throw new Error("예시 오류 상태입니다.");

    if (useMockData) {
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      state.comparisons = forcedState === "empty"
        ? []
        : structuredClone(MOCK_COMPARISONS);
    } else {
      const data = await fetchJson(
        `${API_BASE}/workplaces/${encodeURIComponent(workplaceId)}/compare`,
        { method: "POST" },
      );
      state.comparisons = Array.isArray(data.comparisons) ? data.comparisons : [];
    }

    renderComparisons();
    if (showCompletionToast) showToast("최신 기록으로 비교를 완료했습니다.");
  } catch (error) {
    state.comparisons = [];
    renderMetrics();
    elements.list.replaceChildren();
    showState("error", getFriendlyError(error, "비교 결과를 불러오지 못했어요."));
  } finally {
    elements.runButton.disabled = false;
    elements.runButton.removeAttribute("aria-busy");
  }
}

function setFilter(filter) {
  state.filter = filter;
  elements.tabs.forEach((tab) => {
    const isActive = tab.dataset.filter === filter;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });
  renderComparisons();
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2600);
}

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setFilter(tab.dataset.filter));
});

elements.runButton.addEventListener("click", () => loadComparisons(true));
elements.statePanel.addEventListener("click", (event) => {
  if (event.target.closest("[data-retry]")) loadComparisons();
});

preserveRuntimeContext();
loadComparisons();
