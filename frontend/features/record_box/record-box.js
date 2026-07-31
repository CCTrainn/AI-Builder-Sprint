const DEMO_RECORD_KEY = "work-rights-companion:conversation-demo";

const FALLBACK_RECORD = {
  saved_at: "2026-07-31T12:00:00.000Z",
  workplace_id: "work_001",
  comparison_id: "cmp_001",
  issue: {
    condition: "hourly_wage",
    summary: "계약 시급과 급여 계산 시급이 1,500원 다릅니다.",
    promised_value: 12000,
    actual_value: 10500,
  },
  message: {
    message_id: "msg_001",
    korean_text: "계약서와 급여명세서의 시급이 다른데 계산 근거를 확인해 주실 수 있을까요?",
    translated_text: "Mức lương theo giờ trong hợp đồng và phiếu lương khác nhau. Anh/chị có thể giúp tôi kiểm tra căn cứ tính lương được không?",
    basis: ["계약서 시급 12,000원", "급여명세서 시급 10,500원"],
  },
  employer_reply: "수습기간이라 원래 그렇게 계산해요.",
  analysis: {
    reply_id: "reply_001",
    classification: "partly_answered",
    answered_items: ["수습기간을 적용했다는 주장"],
    unanswered_items: [
      "수습기간의 시작일과 종료일",
      "어디에서 합의했는지",
      "10,500원의 계산 근거",
      "채용공고와 다른 이유",
    ],
    follow_up_korean: "수습기간의 적용 기간과 계약상 합의된 위치를 확인해 주실 수 있을까요?",
    translated_follow_up: "Anh/chị có thể giúp tôi xác nhận thời gian áp dụng thử việc và vị trí nội dung này được thỏa thuận trong hợp đồng không?",
  },
};

function loadRecord() {
  try {
    const savedRecord = window.localStorage.getItem(DEMO_RECORD_KEY);
    return savedRecord ? JSON.parse(savedRecord) : FALLBACK_RECORD;
  } catch {
    return FALLBACK_RECORD;
  }
}

function fillList(selector, values) {
  const list = document.querySelector(selector);
  list.replaceChildren(
    ...values.map((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      return item;
    }),
  );
}

function formatSavedTime(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "오늘";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderRecord(record) {
  const savedTime = formatSavedTime(record.saved_at);

  document.querySelector("#saved-korean-message").textContent = record.message.korean_text;
  document.querySelector("#saved-translated-message").textContent = record.message.translated_text;
  fillList("#saved-basis", record.message.basis);
  document.querySelector("#saved-employer-reply").textContent = record.employer_reply;
  fillList("#saved-answered-list", record.analysis.answered_items);
  fillList("#saved-unanswered-list", record.analysis.unanswered_items);
  document.querySelector("#saved-follow-up").textContent = record.analysis.follow_up_korean;
  document.querySelector("#saved-translated-follow-up").textContent = record.analysis.translated_follow_up;
  document.querySelector("#unanswered-count").textContent = record.analysis.unanswered_items.length;
  document.querySelectorAll("#question-time, #reply-time, #analysis-time").forEach((time) => {
    time.textContent = savedTime;
    time.dateTime = record.saved_at;
  });
}

document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", async () => {
    const text = document.querySelector(`#${button.dataset.copyTarget}`).textContent;
    const feedback = document.querySelector("#record-feedback");

    try {
      await navigator.clipboard.writeText(text);
      feedback.textContent = "문장을 복사했어요.";
    } catch {
      feedback.textContent = "복사하지 못했어요. 문장을 직접 선택해 복사해 주세요.";
    }
  });
});

renderRecord(loadRecord());
