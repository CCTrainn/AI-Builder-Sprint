const params = new URLSearchParams(window.location.search);
const workplaceId = params.get("workplace_id") || readSessionValue("workplace_id") || "demo-e2e";
const runtimeMode = params.get("mode");
const API_BASE = `${window.location.protocol}//${window.location.host}/api/v1`;

const ui = {
  title: document.querySelector("#home-title"),
  description: document.querySelector("#home-description"),
  focusTitle: document.querySelector("#focus-title"),
  focusDescription: document.querySelector("#focus-description"),
  focusAction: document.querySelector("#focus-action"),
  conditionName: document.querySelector("#condition-name"),
  conditionSummary: document.querySelector("#condition-summary"),
  conditionValues: document.querySelector("#condition-values"),
  promisedValue: document.querySelector("#promised-value"),
  actualValue: document.querySelector("#actual-value"),
  detailLink: document.querySelector("#detail-link"),
  progressCount: document.querySelector("#progress-count"),
};

const CONDITION_NAMES = {
  hourly_wage: "시급",
  weekly_holiday_pay: "주휴수당",
  working_hours: "근무시간",
  weekly_working_hours: "주 근무시간",
  pay_date: "급여일",
  gross_pay: "총급여",
  net_pay: "실수령액",
};

writeSessionValue("workplace_id", workplaceId);
preserveRuntimeContext();
enableProgressNavigation();
loadHome();

async function loadHome() {
  try {
    const records = await request(`/records?workplace_id=${encodeURIComponent(workplaceId)}`);
    if (!records.records.length) {
      renderEmpty();
      return;
    }

    const comparisonData = await request(`/workplaces/${encodeURIComponent(workplaceId)}/compare`, { method: "POST" });
    const different = comparisonData.comparisons.filter((item) => item.status === "different");
    if (!different.length) {
      renderCollected(records.total);
      return;
    }

    const primary = prioritize(different)[0];
    const history = await loadHistory(primary.comparison_id);
    const sent = history.some((item) => item.sender === "assistant");
    const employerReplies = history.filter((item) => item.sender === "employer");
    const latestReply = employerReplies.at(-1);
    const finished = latestReply?.analysis?.classification === "fully_answered";
    const experiences = await request(`/community/experiences?workplace_id=${encodeURIComponent(workplaceId)}`).catch(() => ({ experiences: [] }));

    renderActive({ records: records.total, primary, sent, replied: employerReplies.length > 0, finished, experience: experiences.experiences[0] });
  } catch (error) {
    renderUnavailable(error.message);
  }
}

function renderEmpty() {
  ui.title.textContent = "첫 근로자료부터 모아볼까요?";
  ui.description.textContent = "계약서나 급여명세서를 추가하면 기록 사이에 달라진 조건이 있는지 함께 확인합니다.";
  setFocus("첫 자료를 추가해 주세요", "사진이나 PDF 한 개부터 시작할 수 있어요.", "자료 추가하기", "../records/records.html");
  setSummary("아직 모아둔 자료가 없어요", "자료를 추가하면 현재 상황이 여기에 정리됩니다.");
  setProgress(0, "records");
}

function renderCollected(recordCount) {
  ui.title.textContent = "근로자료를 모으고 있어요";
  ui.description.textContent = `${recordCount}개의 자료가 저장되어 있습니다.`;
  setFocus("기록 비교 결과를 확인해 주세요", "서로 다른 조건이나 추가로 필요한 기록이 있는지 살펴보세요.", "기록 비교하기", "../comparison/comparison.html");
  setSummary("자료 수집 완료", `${recordCount}개의 기록에서 근로조건을 추출했습니다.`);
  setProgress(1, "comparison");
}

function renderActive({ records, primary, sent, replied, finished, experience }) {
  const label = CONDITION_NAMES[primary.condition] || "근로조건";
  ui.title.textContent = `${label} 기록을 확인하고 있어요`;
  ui.description.textContent = `${records}개의 자료에서 서로 다른 조건 ${label}을 발견했습니다.`;
  setComparisonSummary(primary, label);

  if (experience) {
    setFocus("정리한 경험을 확인해 주세요", "내용은 언제든 수정할 수 있고, 공유되는 경험은 한 개만 유지됩니다.", "경험 수정하기", "../community/community.html?from=completed");
    setProgress(4, null);
  } else if (finished) {
    setFocus("확인 대화가 마무리됐어요", "모아둔 기록과 대화를 바탕으로 내 경험이 자동 작성됩니다.", "경험 정리하기", "../community/community.html?from=completed");
    setProgress(3, "experience");
  } else if (replied) {
    setFocus("고용주 답변을 확인해 주세요", "답변된 내용과 아직 답변되지 않은 내용을 나누어 보여드립니다.", "답변 분석하기", `../conversation/conversation.html?comparison_id=${encodeURIComponent(primary.comparison_id)}`);
    setProgress(2, "conversation");
  } else if (sent) {
    setFocus("고용주의 답변을 받았나요?", "받은 답변을 붙여 넣으면 다음 질문까지 이어서 정리합니다.", "답변 기록하기", `../conversation/conversation.html?comparison_id=${encodeURIComponent(primary.comparison_id)}#reply-title`);
    setProgress(2, "conversation");
  } else {
    setFocus("고용주에게 확인할 문장을 준비해 주세요", "발견된 기록 차이를 바탕으로 정중하고 명확한 문장을 만듭니다.", "확인 문장 만들기", `../conversation/conversation.html?comparison_id=${encodeURIComponent(primary.comparison_id)}`);
    setProgress(2, "conversation");
  }
}

function renderUnavailable(message) {
  ui.title.textContent = "내 근로 기록";
  ui.description.textContent = "현재 기록 상태를 불러오지 못했지만 자료 추가는 계속할 수 있습니다.";
  setFocus("근로자료를 확인해 주세요", message, "자료 보러 가기", "../records/records.html");
  setSummary("상태를 불러오지 못했어요", "잠시 후 다시 방문하면 현재 진행 상태를 확인할 수 있습니다.");
  setProgress(0, "records");
}

function setFocus(title, description, action, href) {
  ui.focusTitle.textContent = title;
  ui.focusDescription.textContent = description;
  ui.focusAction.firstChild.textContent = `${action} `;
  ui.focusAction.href = withContext(href);
}

function setSummary(name, summary) {
  ui.conditionName.textContent = name;
  ui.conditionSummary.textContent = summary;
  ui.conditionValues.hidden = true;
}

function setComparisonSummary(item, label) {
  ui.conditionName.textContent = `${label} 기록 차이`;
  ui.conditionSummary.textContent = item.summary;
  ui.promisedValue.textContent = formatValue(item.contracted || item.promised);
  ui.actualValue.textContent = formatValue(item.actual);
  ui.conditionValues.hidden = false;
  ui.detailLink.href = withContext(`../comparison/comparison.html?comparison_id=${encodeURIComponent(item.comparison_id)}`);
}

function setProgress(completed, current) {
  const names = ["records", "comparison", "conversation", "experience"];
  names.forEach((name, index) => {
    const row = document.querySelector(`[data-step="${name}"]`);
    const status = row.querySelector("b");
    row.classList.toggle("is-complete", index < completed);
    row.classList.toggle("is-current", name === current);
    status.textContent = index < completed ? "완료" : name === current ? "진행 중" : "대기";
  });
  ui.progressCount.textContent = `${completed} / 4단계 · 단계를 누르면 이동`;
}

async function loadHistory(comparisonId) {
  try {
    const data = await request(`/conversations/${encodeURIComponent(comparisonId)}/history?workplace_id=${encodeURIComponent(workplaceId)}`);
    return data.messages || [];
  } catch {
    return [];
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) throw new Error(body?.error?.message || "기록을 불러오지 못했어요.");
  return body.data;
}

function prioritize(items) {
  const order = { hourly_wage: 0, weekly_holiday_pay: 1, pay_date: 2 };
  return [...items].sort((a, b) => (order[a.condition] ?? 99) - (order[b.condition] ?? 99));
}

function formatValue(value) {
  if (!value) return "기록 없음";
  if (value.unit === "KRW" && typeof value.value === "number") return `${value.value.toLocaleString("ko-KR")}원`;
  return `${value.value}${value.unit ? ` ${value.unit}` : ""}`;
}

function withContext(href) {
  const url = new URL(href, window.location.href);
  url.searchParams.set("workplace_id", workplaceId);
  if (["api", "mock"].includes(runtimeMode)) url.searchParams.set("mode", runtimeMode);
  return url.href;
}

function preserveRuntimeContext() {
  document.querySelectorAll("a[href]").forEach((anchor) => {
    anchor.href = withContext(anchor.getAttribute("href"));
  });
}

function enableProgressNavigation() {
  const targets = {records:"../records/records.html",comparison:"../comparison/comparison.html",conversation:"../conversation/conversation.html",experience:"../community/community.html"};
  Object.entries(targets).forEach(([step,href])=>{
    const row=document.querySelector(`[data-step="${step}"]`);
    row.setAttribute("role","link");
    row.setAttribute("tabindex","0");
    row.setAttribute("aria-label",`${row.querySelector("strong").textContent} 페이지로 이동`);
    const navigate=()=>window.location.assign(withContext(href));
    row.addEventListener("click",navigate);
    row.addEventListener("keydown",(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();navigate();}});
  });
}

function readSessionValue(key) {
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}

function writeSessionValue(key, value) {
  try { window.sessionStorage.setItem(key, value); } catch { /* URL context remains available. */ }
}
