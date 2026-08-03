const DEMO_RECORD_KEY = "work-rights-companion:conversation-demo";
const LANGUAGE_META = {
  ko: { label: "한국어", locale: "ko-KR" }, vi: { label: "Tiếng Việt", locale: "vi-VN" },
  "zh-CN": { label: "简体中文", locale: "zh-CN" }, th: { label: "ภาษาไทย", locale: "th-TH" },
  id: { label: "Bahasa Indonesia", locale: "id-ID" }, en: { label: "English", locale: "en-US" },
};
const DEMO_TRANSLATIONS = {
  ko: {
    question: "계약서와 급여명세서의 시급이 다른데 계산 근거를 확인해 주실 수 있을까요?",
    employer: "수습기간이라 원래 그렇게 계산해요.",
    followUp: "수습기간의 적용 기간과 계약상 합의된 위치를 확인해 주실 수 있을까요?",
  },
  vi: {
    question: "Mức lương theo giờ trong hợp đồng và phiếu lương khác nhau. Anh/chị có thể giúp tôi kiểm tra căn cứ tính lương được không?",
    employer: "Đó là cách tính thông thường vì đang trong thời gian thử việc.",
    followUp: "Anh/chị có thể giúp tôi xác nhận thời gian áp dụng thử việc và vị trí nội dung này được thỏa thuận trong hợp đồng không?",
  },
  "zh-CN": {
    question: "合同和工资明细单上的时薪不同，可以帮我确认工资计算依据吗？",
    employer: "因为是试用期，所以通常就是这样计算的。",
    followUp: "可以确认试用期的适用期间以及合同中约定该内容的位置吗？",
  },
  th: {
    question: "อัตราค่าจ้างรายชั่วโมงในสัญญาและสลิปเงินเดือนไม่ตรงกัน กรุณาช่วยตรวจสอบหลักเกณฑ์การคำนวณได้ไหม",
    employer: "เนื่องจากเป็นช่วงทดลองงานจึงคำนวณแบบนี้ตามปกติ",
    followUp: "กรุณายืนยันระยะเวลาทดลองงานและตำแหน่งของข้อตกลงนี้ในสัญญาได้ไหม",
  },
  id: {
    question: "Upah per jam pada kontrak dan slip gaji berbeda. Bisakah Anda memastikan dasar perhitungannya?",
    employer: "Karena masih masa percobaan, biasanya dihitung seperti itu.",
    followUp: "Bisakah Anda memastikan periode percobaan dan bagian kontrak yang memuat kesepakatan ini?",
  },
  en: {
    question: "The hourly wage differs between the contract and payslip. Could you confirm the basis for the calculation?",
    employer: "It is normally calculated that way because you are on probation.",
    followUp: "Could you confirm the probation period and where this was agreed in the contract?",
  },
};

function displayLanguage() {
  const selected = document.querySelector("#site-language")?.value;
  const requested = new URLSearchParams(window.location.search).get("language");
  const stored = sessionStorage.getItem("site_display_language_v2");
  const value = selected || requested || stored || "ko";
  return LANGUAGE_META[value] ? value : "ko";
}

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

function formatSavedTime(isoDate, language) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "오늘";

  return new Intl.DateTimeFormat(LANGUAGE_META[language].locale, {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderRecord(record) {
  const language = displayLanguage();
  const translation = DEMO_TRANSLATIONS[language];
  const savedTime = formatSavedTime(record.saved_at, language);

  document.querySelector("#saved-korean-message").textContent = record.message.korean_text;
  document.querySelector("#saved-translated-message").textContent = translation.question;
  fillList("#saved-basis", record.message.basis);
  document.querySelector("#saved-employer-reply").textContent = record.employer_reply;
  document.querySelector("#saved-translated-employer-reply").textContent = translation.employer;
  fillList("#saved-answered-list", record.analysis.answered_items);
  fillList("#saved-unanswered-list", record.analysis.unanswered_items);
  document.querySelector("#saved-follow-up").textContent = record.analysis.follow_up_korean;
  document.querySelector("#saved-translated-follow-up").textContent = translation.followUp;
  document.querySelectorAll(".record-language-label").forEach((label) => {
    label.textContent = LANGUAGE_META[language].label;
  });
  document.querySelectorAll(".translation-box").forEach((box) => {
    box.hidden = language === "ko";
  });
  document.querySelectorAll("#saved-translated-message, #saved-translated-employer-reply, #saved-translated-follow-up").forEach((element) => {
    element.lang = language;
  });
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
document.addEventListener("userlanguagechange", () => renderRecord(loadRecord()));
