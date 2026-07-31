const params = new URLSearchParams(window.location.search);
const requestedWorkplaceId = params.get("workplace_id");
const storedWorkplaceId = readSessionValue("workplace_id");
const workplaceId = requestedWorkplaceId || storedWorkplaceId || "demo-e2e";
const useMockData = params.get("mode") === "mock";
const forcedState = params.get("state");
const API_BASE = resolveApiBase();
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 40;

writeSessionValue("workplace_id", workplaceId);

const RECORD_TYPES = {
  job_posting: "채용공고",
  employment_contract: "근로계약서",
  employer_message: "고용주 대화",
  verbal_memo: "구두 약속 메모",
  work_schedule: "근무표",
  attendance: "출퇴근 기록",
  payslip: "급여명세서",
  bank_deposit: "입금내역",
  workplace_notice: "사업장 공지",
  other: "기타",
};

const STATUS_META = {
  uploaded: { label: "업로드 완료", className: "uploaded" },
  processing: { label: "분석 중", className: "processing" },
  completed: { label: "분석 완료", className: "completed" },
  failed: { label: "확인 필요", className: "failed" },
};

const CONDITION_LABELS = {
  hourly_wage: "시간급",
  working_hours: "근로시간",
  pay_date: "급여일",
  probation: "수습기간",
  weekly_holiday_pay: "주휴수당",
};

const MOCK_RECORDS = [
  {
    record_id: "rec_payslip",
    workplace_id: workplaceId,
    record_type: "payslip",
    file_name: "7월_급여명세서.pdf",
    recorded_at: "2026-07-30",
    processing_status: "completed",
    condition_count: 9,
    created_at: "2026-07-30T01:25:43+00:00",
    original_text: "7월 급여 산정 내역",
    conditions: [
      { type: "hourly_wage", value: 10500, unit: "KRW", confidence: 0.96 },
      { type: "working_hours", value: 82, unit: "hour", confidence: 0.92 },
      { type: "pay_date", value: "매월 10일", unit: null, confidence: 0.89 },
    ],
  },
  {
    record_id: "rec_attendance",
    workplace_id: workplaceId,
    record_type: "attendance",
    file_name: "7월_출퇴근기록.jpg",
    recorded_at: "2026-07-29",
    processing_status: "processing",
    condition_count: 0,
    created_at: "2026-07-29T04:10:00+00:00",
    conditions: [],
  },
  {
    record_id: "rec_contract",
    workplace_id: workplaceId,
    record_type: "employment_contract",
    file_name: "근로계약서.pdf",
    recorded_at: "2026-07-15",
    processing_status: "completed",
    condition_count: 7,
    created_at: "2026-07-15T02:12:00+00:00",
    original_text: "시간급 12,000원, 주 20시간",
    conditions: [
      { type: "hourly_wage", value: 12000, unit: "KRW", confidence: 0.96 },
      { type: "working_hours", value: 20, unit: "hour", confidence: 0.93 },
      { type: "probation", value: "기간 불명확", unit: null, confidence: 0.68 },
    ],
  },
  {
    record_id: "rec_job",
    workplace_id: workplaceId,
    record_type: "job_posting",
    file_name: "채용공고_캡처.png",
    recorded_at: "2026-06-25",
    processing_status: "completed",
    condition_count: 4,
    created_at: "2026-06-25T09:00:00+00:00",
    original_text: "시급 12,000원, 주 20시간",
    conditions: [
      { type: "hourly_wage", value: 12000, unit: "KRW", confidence: 0.91 },
      { type: "working_hours", value: 20, unit: "hour", confidence: 0.88 },
    ],
  },
  {
    record_id: "rec_notice",
    workplace_id: workplaceId,
    record_type: "workplace_notice",
    file_name: "근무시간_안내.jpg",
    recorded_at: "2026-06-20",
    processing_status: "failed",
    condition_count: 0,
    created_at: "2026-06-20T08:30:00+00:00",
    conditions: [],
  },
];

const elements = {
  uploadForm: document.querySelector("#uploadForm"),
  fileInput: document.querySelector("#recordFile"),
  filePrompt: document.querySelector("#filePrompt"),
  fileHint: document.querySelector("#fileHint"),
  dropzone: document.querySelector("#dropzone"),
  recordType: document.querySelector("#recordType"),
  recordedAt: document.querySelector("#recordedAt"),
  uploadButton: document.querySelector("#uploadButton"),
  uploadError: document.querySelector("#uploadError"),
  typeFilter: document.querySelector("#typeFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  recordsState: document.querySelector("#recordsState"),
  recordsList: document.querySelector("#recordsList"),
  totalCount: document.querySelector("#totalRecordCount"),
  completedCount: document.querySelector("#completedRecordCount"),
  processingCount: document.querySelector("#processingRecordCount"),
  failedCount: document.querySelector("#failedRecordCount"),
  dialog: document.querySelector("#recordDialog"),
  dialogType: document.querySelector("#dialogType"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogContent: document.querySelector("#dialogContent"),
  dialogClose: document.querySelector("#dialogClose"),
  dialogConfirm: document.querySelector("#dialogConfirm"),
  deleteButton: document.querySelector("#deleteRecordButton"),
  toast: document.querySelector("#toast"),
};

const state = {
  records: [],
  selectedFile: null,
  selectedRecordId: null,
  pollingRecordIds: new Set(),
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
  UNSUPPORTED_FILE_TYPE: "PDF, JPG, PNG 파일로 다시 추가해 주세요.",
  FILE_TOO_LARGE: "파일 크기는 10MB 이하여야 해요.",
  EMPTY_FILE: "내용이 있는 파일을 선택해 주세요.",
  STORAGE_NOT_CONFIGURED: "파일 저장 공간이 아직 연결되지 않았어요.",
  STORAGE_UPLOAD_FAILED: "원본 파일을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
  RECORD_SAVE_FAILED: "파일 정보 저장에 실패했어요. 업로드를 다시 시도해 주세요.",
  RECORD_LIST_FAILED: "근무자료 목록을 불러오지 못했어요.",
  RECORD_LOOKUP_FAILED: "근무자료 상세 내용을 불러오지 못했어요.",
  RECORD_NOT_FOUND: "해당 근무자료를 찾을 수 없어요.",
  STORAGE_DELETE_FAILED: "원본 파일을 삭제하지 못해 기록 삭제를 중단했어요.",
  RECORD_DELETE_FAILED: "기록을 삭제하지 못했어요.",
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

function formatDate(value) {
  if (!value) return "날짜 없음";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatConditionValue(condition) {
  if (condition.value === null || condition.value === undefined) return "확인되지 않음";
  if (condition.unit === "KRW" && typeof condition.value === "number") {
    return `${condition.value.toLocaleString("ko-KR")}원`;
  }
  if (condition.unit === "hour") return `${condition.value}시간`;
  return String(condition.value);
}

function getRecordIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 2h8l4 4v16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/>
      <path d="M14 2v5h5M8 12h8M8 16h6"/>
    </svg>
  `;
}

function renderSummary() {
  const processingStatuses = new Set(["uploaded", "processing"]);
  elements.totalCount.textContent = state.records.length;
  elements.completedCount.textContent = state.records.filter(
    (record) => record.processing_status === "completed",
  ).length;
  elements.processingCount.textContent = state.records.filter((record) =>
    processingStatuses.has(record.processing_status),
  ).length;
  elements.failedCount.textContent = state.records.filter(
    (record) => record.processing_status === "failed",
  ).length;
}

function getFilteredRecords() {
  const type = elements.typeFilter.value;
  const status = elements.statusFilter.value;

  return state.records
    .filter((record) => type === "all" || record.record_type === type)
    .filter((record) => {
      if (status === "all") return true;
      if (status === "processing") {
        return record.processing_status === "processing" || record.processing_status === "uploaded";
      }
      return record.processing_status === status;
    })
    .sort((a, b) => String(b.recorded_at).localeCompare(String(a.recorded_at)));
}

function renderRecords() {
  renderSummary();
  const records = getFilteredRecords();
  elements.recordsState.replaceChildren();

  if (state.records.length === 0) {
    elements.recordsList.replaceChildren();
    showState("empty");
    return;
  }

  if (records.length === 0) {
    elements.recordsList.replaceChildren();
    showState("filtered-empty");
    return;
  }

  elements.recordsList.innerHTML = records.map((record) => {
    const status = STATUS_META[record.processing_status] || STATUS_META.uploaded;
    const conditionText = record.processing_status === "completed"
      ? `찾은 조건 ${record.condition_count ?? 0}개`
      : status.label;

    return `
      <article class="record-item">
        <button class="record-open" type="button" data-record-id="${escapeHtml(record.record_id)}">
          <span class="record-icon">${getRecordIcon()}</span>
          <span class="record-copy">
            <strong>${escapeHtml(RECORD_TYPES[record.record_type] || "기타 자료")} · ${escapeHtml(record.file_name)}</strong>
            <span>${escapeHtml(formatDate(record.recorded_at))} · ${escapeHtml(conditionText)}</span>
          </span>
        </button>
        <div class="record-meta">
          <span class="status-badge status-badge--${escapeHtml(status.className)}">
            <span class="status-dot" aria-hidden="true"></span>
            ${escapeHtml(status.label)}
          </span>
          <button class="record-more" type="button" data-delete-record="${escapeHtml(record.record_id)}" aria-label="${escapeHtml(record.file_name)} 삭제">···</button>
        </div>
      </article>
    `;
  }).join("");
}

function showState(type, message = "") {
  const states = {
    loading: {
      icon: "",
      title: "근무자료를 불러오고 있어요",
      description: "잠시만 기다려 주세요.",
      loading: true,
    },
    empty: {
      icon: "+",
      title: "아직 모아둔 자료가 없어요",
      description: "채용공고나 근로계약서부터 추가하면 기록의 변화를 확인할 수 있어요.",
    },
    "filtered-empty": {
      icon: "⌕",
      title: "조건에 맞는 자료가 없어요",
      description: "다른 종류나 처리 상태를 선택해 보세요.",
    },
    error: {
      icon: "!",
      title: "근무자료를 불러오지 못했어요",
      description: message || "잠시 후 다시 시도해 주세요. 저장된 자료는 삭제되지 않았어요.",
      retry: true,
    },
  };

  const item = states[type];
  if (!item) return;

  elements.recordsState.innerHTML = `
    <div class="state-content">
      ${item.loading ? '<div class="loading-line" aria-hidden="true"></div>' : `<span class="state-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>`}
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.description)}</p>
      ${item.retry ? '<button class="secondary-button" type="button" data-retry>다시 시도하기</button>' : ""}
    </div>
  `;
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

async function loadRecords() {
  elements.recordsList.replaceChildren();
  showState("loading");

  try {
    if (forcedState === "error") throw new Error("예시 오류 상태입니다.");

    if (useMockData) {
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      state.records = forcedState === "empty" ? [] : structuredClone(MOCK_RECORDS);
    } else {
      const data = await fetchJson(
        `${API_BASE}/records?workplace_id=${encodeURIComponent(workplaceId)}`,
      );
      state.records = Array.isArray(data.records) ? data.records : [];
    }

    renderRecords();
    if (!useMockData) {
      state.records
        .filter((record) => ["uploaded", "processing"].includes(record.processing_status))
        .forEach((record) => pollRecordProcessing(record.record_id));
    }
  } catch (error) {
    state.records = [];
    renderSummary();
    elements.recordsList.replaceChildren();
    showState("error", getFriendlyError(error, "근무자료를 불러오지 못했어요."));
  }
}

function updateSelectedFile(file) {
  state.selectedFile = file || null;
  elements.uploadError.hidden = true;

  if (!file) {
    elements.dropzone.classList.remove("has-file");
    elements.filePrompt.textContent = "파일이나 사진을 선택하세요";
    elements.fileHint.textContent = "PDF, JPG, PNG · 최대 10MB";
    return;
  }

  elements.dropzone.classList.add("has-file");
  elements.filePrompt.textContent = file.name;
  elements.fileHint.textContent = `${Math.max(1, Math.ceil(file.size / 1024)).toLocaleString("ko-KR")}KB · 선택됨`;
}

function validateUpload() {
  const file = state.selectedFile || elements.fileInput.files[0];
  if (!file) return "추가할 파일을 선택해 주세요.";
  if (file.size > 10 * 1024 * 1024) return "파일 크기는 10MB 이하여야 합니다.";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!["pdf", "jpg", "jpeg", "png"].includes(extension)) {
    return "PDF, JPG, PNG 파일만 추가할 수 있습니다.";
  }
  if (!elements.recordType.value) return "자료 종류를 선택해 주세요.";
  if (!elements.recordedAt.value) return "자료의 날짜를 입력해 주세요.";
  return "";
}

function setUploadBusy(isBusy) {
  elements.uploadButton.disabled = isBusy;
  elements.uploadButton.querySelector("span").textContent = isBusy ? "자료를 추가하는 중…" : "자료 추가하기";
}

async function uploadRecord(event) {
  event.preventDefault();
  const errorMessage = validateUpload();

  if (errorMessage) {
    elements.uploadError.textContent = errorMessage;
    elements.uploadError.hidden = false;
    return;
  }

  const file = state.selectedFile || elements.fileInput.files[0];
  setUploadBusy(true);
  elements.uploadError.hidden = true;

  try {
    if (useMockData) {
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      const newRecord = {
        record_id: `rec_${Date.now()}`,
        workplace_id: workplaceId,
        record_type: elements.recordType.value,
        file_name: file.name,
        recorded_at: elements.recordedAt.value,
        processing_status: "uploaded",
        condition_count: 0,
        created_at: new Date().toISOString(),
        conditions: [],
      };
      state.records.unshift(newRecord);
      renderRecords();
      showToast("자료를 추가했습니다. 내용을 분석하고 있어요.");

      window.setTimeout(() => updateMockStatus(newRecord.record_id, "processing"), 700);
      window.setTimeout(() => updateMockStatus(newRecord.record_id, "completed", 3), 2100);
    } else {
      const formData = new FormData();
      formData.append("workplace_id", workplaceId);
      formData.append("record_type", elements.recordType.value);
      formData.append("recorded_at", elements.recordedAt.value);
      formData.append("file", file);
      const uploaded = await fetchJson(`${API_BASE}/records/upload`, {
        method: "POST",
        body: formData,
      });
      state.records = [
        {
          ...uploaded,
          recorded_at: elements.recordedAt.value,
          condition_count: 0,
          created_at: new Date().toISOString(),
          conditions: [],
        },
        ...state.records.filter((record) => record.record_id !== uploaded.record_id),
      ];
      renderRecords();
      showToast("자료를 추가했습니다. 내용을 분석하고 있어요.");
      pollRecordProcessing(uploaded.record_id);
    }

    elements.uploadForm.reset();
    setDefaultDate();
    updateSelectedFile(null);
  } catch (error) {
    elements.uploadError.textContent = getFriendlyError(error, "자료를 추가하지 못했어요.");
    elements.uploadError.hidden = false;
  } finally {
    setUploadBusy(false);
  }
}

function updateMockStatus(recordId, processingStatus, conditionCount = 0) {
  const record = state.records.find((item) => item.record_id === recordId);
  if (!record) return;
  record.processing_status = processingStatus;
  record.condition_count = conditionCount;
  renderRecords();
}

async function pollRecordProcessing(recordId) {
  if (state.pollingRecordIds.has(recordId)) return;
  state.pollingRecordIds.add(recordId);

  try {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      const detail = await fetchJson(`${API_BASE}/records/${encodeURIComponent(recordId)}`);
      const record = state.records.find((item) => item.record_id === recordId);
      if (!record) return;

      record.processing_status = detail.processing_status;
      record.record_type = detail.record_type;
      record.condition_count = Array.isArray(detail.conditions) ? detail.conditions.length : 0;
      record.conditions = Array.isArray(detail.conditions) ? detail.conditions : [];
      renderRecords();

      if (detail.processing_status === "completed") {
        showToast("자료 분석을 완료했습니다.");
        return;
      }
      if (detail.processing_status === "failed") {
        showToast("자료 내용을 읽지 못했어요. 파일을 확인해 주세요.");
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
    }

    showToast("분석이 계속 진행 중이에요. 잠시 후 다시 확인해 주세요.");
  } catch (error) {
    showToast(getFriendlyError(error, "분석 상태 자동 확인을 중단했어요."));
  } finally {
    state.pollingRecordIds.delete(recordId);
  }
}

async function openRecord(recordId) {
  state.selectedRecordId = recordId;
  const summary = state.records.find((record) => record.record_id === recordId);
  if (!summary) return;

  elements.dialogType.textContent = RECORD_TYPES[summary.record_type] || "기타 자료";
  elements.dialogTitle.textContent = summary.file_name;
  elements.dialogContent.innerHTML = '<div class="state-content"><div class="loading-line"></div><p>자료 내용을 불러오고 있어요.</p></div>';
  openDialog();

  try {
    const detail = useMockData
      ? summary
      : await fetchJson(`${API_BASE}/records/${encodeURIComponent(recordId)}`);
    renderRecordDetail({ ...summary, ...detail });
  } catch (error) {
    elements.dialogContent.innerHTML = `
      <div class="state-content">
        <span class="state-icon" aria-hidden="true">!</span>
        <strong>자료 내용을 불러오지 못했어요</strong>
        <p>${escapeHtml(getFriendlyError(error, "자료 내용을 불러오지 못했어요."))}</p>
      </div>
    `;
  }
}

function renderRecordDetail(record) {
  const status = STATUS_META[record.processing_status] || STATUS_META.uploaded;
  const conditions = Array.isArray(record.conditions) ? record.conditions : [];

  elements.dialogContent.innerHTML = `
    <div class="detail-grid">
      <div><span>기록 날짜</span><strong>${escapeHtml(formatDate(record.recorded_at))}</strong></div>
      <div><span>처리 상태</span><strong>${escapeHtml(status.label)}</strong></div>
      <div><span>자료 종류</span><strong>${escapeHtml(RECORD_TYPES[record.record_type] || "기타 자료")}</strong></div>
      <div><span>찾은 조건</span><strong>${escapeHtml(record.condition_count ?? conditions.length)}개</strong></div>
    </div>
    <h3 class="conditions-title">자료에서 찾은 조건</h3>
    <div class="conditions-list">
      ${conditions.length > 0
        ? conditions.map((condition) => `
          <div class="condition-item">
            <span>${escapeHtml(CONDITION_LABELS[condition.type] || condition.type)}</span>
            <strong>${escapeHtml(formatConditionValue(condition))}</strong>
          </div>
        `).join("")
        : '<div class="condition-item"><span>아직 찾은 조건이 없어요.</span></div>'}
    </div>
  `;
}

function openDialog() {
  if (typeof elements.dialog.showModal === "function") {
    if (!elements.dialog.open) elements.dialog.showModal();
  } else {
    elements.dialog.setAttribute("open", "");
  }
}

function closeDialog() {
  if (typeof elements.dialog.close === "function") elements.dialog.close();
  else elements.dialog.removeAttribute("open");
}

async function deleteRecord(recordId) {
  const record = state.records.find((item) => item.record_id === recordId);
  if (!record) return;
  const confirmed = window.confirm(`“${record.file_name}” 자료를 삭제할까요? 원본 파일과 추출된 조건도 함께 삭제됩니다.`);
  if (!confirmed) return;

  try {
    if (!useMockData) {
      await fetchJson(`${API_BASE}/records/${encodeURIComponent(recordId)}`, { method: "DELETE" });
    }
    state.records = state.records.filter((item) => item.record_id !== recordId);
    renderRecords();
    closeDialog();
    showToast("자료를 삭제했습니다.");
  } catch (error) {
    showToast(getFriendlyError(error, "자료를 삭제하지 못했어요."));
  }
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2600);
}

function setDefaultDate() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  elements.recordedAt.value = localDate;
}

elements.fileInput.addEventListener("change", () => {
  updateSelectedFile(elements.fileInput.files[0]);
});

["dragenter", "dragover"].forEach((eventName) => {
  elements.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropzone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  elements.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropzone.classList.remove("is-dragging");
  });
});

elements.dropzone.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files?.[0];
  if (file) updateSelectedFile(file);
});

elements.uploadForm.addEventListener("submit", uploadRecord);
elements.typeFilter.addEventListener("change", renderRecords);
elements.statusFilter.addEventListener("change", renderRecords);

elements.recordsList.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-record-id]");
  const deleteButton = event.target.closest("[data-delete-record]");
  if (openButton) openRecord(openButton.dataset.recordId);
  if (deleteButton) deleteRecord(deleteButton.dataset.deleteRecord);
});

elements.recordsState.addEventListener("click", (event) => {
  if (event.target.closest("[data-retry]")) loadRecords();
});

elements.dialogClose.addEventListener("click", closeDialog);
elements.dialogConfirm.addEventListener("click", closeDialog);
elements.deleteButton.addEventListener("click", () => {
  if (state.selectedRecordId) deleteRecord(state.selectedRecordId);
});
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) closeDialog();
});

preserveRuntimeContext();
setDefaultDate();
loadRecords();
