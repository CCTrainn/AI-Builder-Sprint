const pageParams = new URLSearchParams(window.location.search);
const requestedWorkplaceId = pageParams.get("workplace_id");
const storedWorkplaceId = readSessionValue("workplace_id");
const workplaceId = requestedWorkplaceId || storedWorkplaceId || "demo-e2e";
const comparisonId = pageParams.get("comparison_id") || "cmp_001";
const useMockData = pageParams.get("mode") === "mock";
const API_BASE = resolveApiBase();

const SUPPORTED_LANGUAGES = {
  ko: { label: "한국어", htmlLang: "ko" },
  vi: { label: "Tiếng Việt", htmlLang: "vi" },
  "zh-CN": { label: "简体中文", htmlLang: "zh-CN" },
  th: { label: "ภาษาไทย", htmlLang: "th" },
  id: { label: "Bahasa Indonesia", htmlLang: "id" },
  en: { label: "English", htmlLang: "en" },
};

const requestedLanguage = pageParams.get("language");
const storedLanguage = readSessionValue("site_display_language_v2");
const initialLanguage = [requestedLanguage, storedLanguage, "ko"].find(
  (language) => language && SUPPORTED_LANGUAGES[language],
);

writeSessionValue("workplace_id", workplaceId);
writeSessionValue("site_display_language_v2", initialLanguage);
writeSessionValue("user_language", initialLanguage);

const MESSAGE_REQUEST = {
  workplace_id: workplaceId,
  comparison_id: comparisonId,
  tone: "polite",
  user_language: initialLanguage,
};

const MOCK_RESPONSES = {
  polite: {
    message_id: "msg_001",
    conversation_id: "conv_mock",
    korean_text: "계약서와 급여명세서의 시급이 다른데 계산 근거를 확인해 주실 수 있을까요?",
    translated_text: "Mức lương theo giờ trong hợp đồng và phiếu lương khác nhau. Anh/chị có thể giúp tôi kiểm tra căn cứ tính lương được không?",
    basis: ["계약서 시급 12,000원", "급여명세서 시급 10,500원", "비슷한 공동 경험 4건에서 계산 근거 확인이 도움이 됨"],
  },
  clear: {
    message_id: "msg_002",
    conversation_id: "conv_mock",
    korean_text: "계약서에는 시급 12,000원, 급여명세서에는 10,500원으로 기록되어 있습니다. 수습기간의 적용 여부와 기간, 계산 근거를 알려주세요.",
    translated_text: "Hợp đồng ghi 12.000 won/giờ, nhưng phiếu lương ghi 10.500 won/giờ. Xin hãy cho tôi biết có áp dụng thử việc hay không, thời gian áp dụng và căn cứ tính lương.",
    basis: ["계약서 시급 12,000원", "급여명세서 시급 10,500원", "비슷한 공동 경험 4건에서 계산 근거 확인이 도움이 됨"],
  },
  firm: {
    message_id: "msg_003",
    conversation_id: "conv_mock",
    korean_text: "계약서의 시급 12,000원과 급여명세서의 계산 시급 10,500원이 다릅니다. 수습기간의 합의 내용과 적용 기간, 계산 근거를 서면으로 답변해 주세요.",
    translated_text: "Mức lương 12.000 won/giờ trong hợp đồng khác với mức 10.500 won/giờ trên phiếu lương. Xin hãy trả lời bằng văn bản về nội dung thỏa thuận thử việc, thời gian áp dụng và căn cứ tính mức lương.",
    basis: ["계약서 시급 12,000원", "급여명세서 시급 10,500원", "비슷한 공동 경험 4건에서 계산 근거 확인이 도움이 됨"],
  },
};

const MOCK_REPLY_ANALYSIS = {
  reply_id: "reply_001",
  conversation_id: "conv_mock",
  classification: "partly_answered",
  claims: [{ text: "수습기간을 적용했다고 설명함", status: "claimed" }],
  answered_items: ["수습기간을 적용했다는 주장"],
  unanswered_items: ["수습기간의 시작일과 종료일", "계산 근거"],
  tactics: [{ type: "customary_claim", explanation: "관행이라는 설명만 있고 계산 근거는 확인되지 않았습니다." }],
  evidence_check: { status: "record_difference", explanation: "계약서와 급여명세서의 시급 기록이 다릅니다." },
  safety_mode: false,
  safety_note: null,
  translated_reply: "Đó là cách tính thông thường vì đang trong thời gian thử việc.",
  follow_up_korean: "수습기간의 적용 기간과 시급 계산 근거를 확인해 주실 수 있을까요?",
  translated_follow_up: "Anh/chị có thể xác nhận thời gian áp dụng thử việc và căn cứ tính lương theo giờ không?",
};

const MOCK_TRANSLATIONS = {
  ko: {
    message: {
      polite: MOCK_RESPONSES.polite.korean_text,
      clear: MOCK_RESPONSES.clear.korean_text,
      firm: MOCK_RESPONSES.firm.korean_text,
    },
    followUp: MOCK_REPLY_ANALYSIS.follow_up_korean,
    employerReply: "수습기간이라 원래 그렇게 계산해요.",
  },
  vi: {
    message: {
      polite: "Mức lương theo giờ trong hợp đồng và phiếu lương khác nhau. Anh/chị có thể giúp tôi kiểm tra căn cứ tính lương được không?",
      clear: "Hợp đồng ghi 12.000 won/giờ, nhưng phiếu lương ghi 10.500 won/giờ. Xin hãy cho tôi biết có áp dụng thử việc hay không, thời gian áp dụng và căn cứ tính lương.",
      firm: "Mức lương 12.000 won/giờ trong hợp đồng khác với mức 10.500 won/giờ trên phiếu lương. Xin hãy trả lời bằng văn bản về nội dung thỏa thuận thử việc, thời gian áp dụng và căn cứ tính lương.",
    },
    followUp: "Anh/chị có thể xác nhận thời gian áp dụng thử việc và căn cứ tính lương theo giờ không?",
    employerReply: "Đó là cách tính thông thường vì đang trong thời gian thử việc.",
  },
  "zh-CN": {
    message: {
      polite: "合同和工资明细单上的时薪不同，可以帮我确认一下工资计算依据吗？",
      clear: "劳动合同中记录的时薪为12,000韩元，工资明细单中为10,500韩元。请告知是否适用试用期、适用期间以及工资计算依据。",
      firm: "劳动合同中的时薪12,000韩元与工资明细单中的计算时薪10,500韩元不一致。请以书面形式答复试用期的约定内容、适用期间和计算依据。",
    },
    followUp: "可以请您确认试用期的适用期间和时薪计算依据吗？",
    employerReply: "因为是试用期，所以通常就是这样计算的。",
  },
  th: {
    message: {
      polite: "อัตราค่าจ้างรายชั่วโมงในสัญญาจ้างและสลิปเงินเดือนไม่ตรงกัน กรุณาช่วยตรวจสอบหลักเกณฑ์การคำนวณค่าจ้างได้ไหมคะ/ครับ",
      clear: "ในสัญญาจ้างระบุค่าจ้างชั่วโมงละ 12,000 วอน แต่ในสลิปเงินเดือนระบุ 10,500 วอน กรุณาแจ้งว่ามีการใช้ช่วงทดลองงานหรือไม่ ระยะเวลาที่ใช้ และหลักเกณฑ์การคำนวณค่าจ้าง",
      firm: "ค่าจ้างชั่วโมงละ 12,000 วอนในสัญญาจ้างไม่ตรงกับอัตรา 10,500 วอนที่ใช้คำนวณในสลิปเงินเดือน กรุณาตอบเป็นลายลักษณ์อักษรเกี่ยวกับข้อตกลงช่วงทดลองงาน ระยะเวลาที่ใช้ และหลักเกณฑ์การคำนวณ",
    },
    followUp: "กรุณาช่วยยืนยันระยะเวลาที่ใช้ช่วงทดลองงานและหลักเกณฑ์การคำนวณค่าจ้างรายชั่วโมงได้ไหมคะ/ครับ",
    employerReply: "เนื่องจากเป็นช่วงทดลองงานจึงคำนวณแบบนี้ตามปกติ",
  },
  id: {
    message: {
      polite: "Upah per jam pada kontrak dan slip gaji berbeda. Bisakah Anda membantu memastikan dasar perhitungan upahnya?",
      clear: "Kontrak mencatat upah 12.000 won per jam, sedangkan slip gaji mencatat 10.500 won. Mohon jelaskan apakah masa percobaan diterapkan, periode penerapannya, dan dasar perhitungan upah.",
      firm: "Upah 12.000 won per jam dalam kontrak berbeda dengan upah 10.500 won yang digunakan pada slip gaji. Mohon berikan jawaban tertulis mengenai kesepakatan masa percobaan, periode penerapan, dan dasar perhitungannya.",
    },
    followUp: "Bisakah Anda memastikan periode penerapan masa percobaan dan dasar perhitungan upah per jam?",
    employerReply: "Karena masih masa percobaan, biasanya dihitung seperti itu.",
  },
  en: {
    message: {
      polite: "The hourly wage shown in the employment contract and the payslip is different. Could you please confirm the basis used to calculate my wage?",
      clear: "The employment contract states an hourly wage of KRW 12,000, while the payslip shows KRW 10,500. Please explain whether a probationary period applies, how long it applies, and the basis for the wage calculation.",
      firm: "The hourly wage of KRW 12,000 in the employment contract differs from the KRW 10,500 rate used on the payslip. Please provide a written response explaining the probation agreement, the applicable period, and the basis for the calculation.",
    },
    followUp: "Could you please confirm the applicable probationary period and the basis used to calculate the hourly wage?",
    employerReply: "It is normally calculated that way because you are on probation.",
  },
};

const CLASSIFICATION_LABELS = {
  fully_answered: { title: "질문한 내용이 모두 답변되었어요", badge: "전체 답변" },
  partly_answered: { title: "일부만 답변되었어요", badge: "부분 답변" },
  not_answered: { title: "질문한 내용이 답변되지 않았어요", badge: "미답변" },
  unclear: { title: "답변의 의미를 더 확인해야 해요", badge: "불명확" },
  new_condition: { title: "새로운 조건이 답변에 포함되어 있어요", badge: "새 조건" },
  more_evidence_needed: { title: "확인할 기록이 더 필요해요", badge: "자료 필요" },
};

const TACTIC_LABELS = {
  evasive: "질문 회피 가능성",
  customary_claim: "관행형 설명",
  unsupported_legal_claim: "근거 없는 법적 단정",
  blame_shifting: "책임 전가 표현",
  delaying: "답변 미루기",
  new_condition: "새 조건 언급",
  intimidating: "위축 유도 표현",
};

const koreanText = document.querySelector("#korean-text");
const translatedText = document.querySelector("#translated-text");
const basisList = document.querySelector("#basis-list");
const messageResult = document.querySelector("#message-result");
const requestStatus = document.querySelector("#request-status");
const errorState = document.querySelector("#error-state");
const errorMessage = document.querySelector("#error-message");
const actionFeedback = document.querySelector("#action-feedback");
const employerReply = document.querySelector("#employer-reply");
const replyCharacterCount = document.querySelector("#reply-character-count");
const analyzeReplyButton = document.querySelector("#analyze-reply");
const analysisEmpty = document.querySelector("#analysis-empty");
const analysisLoading = document.querySelector("#analysis-loading");
const analysisError = document.querySelector("#analysis-error");
const analysisResult = document.querySelector("#analysis-result");
const analysisBadge = document.querySelector(".analysis-badge");
const analysisFeedback = document.querySelector("#analysis-feedback");
const historyStatus = document.querySelector("#conversation-history-status");
const historyList = document.querySelector("#history-list");
const historyEmpty = document.querySelector("#history-empty");
const historyCount = document.querySelector("#history-count");
const sentMessageText = document.querySelector("#sent-message-text");
const sentMessageCount = document.querySelector("#sent-message-count");
const recordSentMessageButton = document.querySelector("#record-sent-message");
const languageSelect = document.querySelector("#site-language");
const translationLanguageLabel = document.querySelector("#translation-language-label");
const followUpLanguageLabel = document.querySelector("#follow-up-language-label");
const replyLanguageLabel = document.querySelector("#reply-language-label");
const replyTranslation = document.querySelector("#employer-reply-translation");
const translatedEmployerReply = document.querySelector("#translated-employer-reply");
const messageTranslation = document.querySelector(".translated-message");
const followUpTranslation = document.querySelector(".follow-up-translation");

let selectedTone = MESSAGE_REQUEST.tone;
let selectedLanguage = MESSAGE_REQUEST.user_language;
let currentMessage = null;
let currentReplyAnalysis = null;
let requestSequence = 0;
const mockHistory = [];

const CONDITION_LABELS = {
  hourly_wage: "시급",
  weekly_holiday_pay: "주휴수당",
  working_hours: "근로시간",
  weekly_working_hours: "주 근로시간",
  total_working_hours: "총 근로시간",
  overtime_hours: "연장근로",
  break_time: "휴게시간",
  pay_date: "급여일",
  probation: "수습기간",
  basic_pay: "기본급",
  gross_pay: "지급액",
  deductions: "공제액",
  net_pay: "실수령액",
};

const HISTORY_SENDER_LABELS = {
  ko: { employer: "고용주에게 받은 카톡", assistant: "내가 보낸 카톡" },
  vi: { employer: "Tin KakaoTalk nhận từ chủ lao động", assistant: "Tin KakaoTalk tôi đã gửi" },
  "zh-CN": { employer: "雇主发来的KakaoTalk消息", assistant: "我发送的KakaoTalk消息" },
  th: { employer: "ข้อความ KakaoTalk จากนายจ้าง", assistant: "ข้อความ KakaoTalk ที่ฉันส่ง" },
  id: { employer: "Pesan KakaoTalk dari pemberi kerja", assistant: "Pesan KakaoTalk yang saya kirim" },
  en: { employer: "KakaoTalk received from employer", assistant: "KakaoTalk I sent" },
};

function resolveApiBase() {
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return isLocal
    ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
    : `${window.location.origin}/api/v1`;
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
    // URL 값만으로도 화면을 계속 사용할 수 있습니다.
  }
}

class ApiRequestError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function fetchJson(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new ApiRequestError("NETWORK_ERROR", "백엔드에 연결하지 못했습니다.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    throw new ApiRequestError(
      body?.error?.code || "UNKNOWN_ERROR",
      body?.error?.message || "요청을 처리하지 못했습니다.",
    );
  }
  return body.data;
}

function fillList(list, values) {
  list.replaceChildren(
    ...values.map((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      return item;
    }),
  );
}

function renderMessage(message) {
  koreanText.textContent = message.korean_text;
  translatedText.textContent = message.translated_text;
  basisList.replaceChildren(
    ...(message.basis || []).map((basis) => {
      const item = document.createElement("li");
      item.textContent = basis;
      return item;
    }),
  );
}

function updateLanguageDisplay(language) {
  const metadata = SUPPORTED_LANGUAGES[language];
  languageSelect.value = language;
  translationLanguageLabel.textContent = metadata.label;
  followUpLanguageLabel.textContent = metadata.label;
  replyLanguageLabel.textContent = metadata.label;
  translatedText.lang = metadata.htmlLang;
  document.querySelector("#translated-follow-up").lang = metadata.htmlLang;
  translatedEmployerReply.lang = metadata.htmlLang;
  const isKorean = language === "ko";
  messageTranslation.hidden = isKorean;
  followUpTranslation.hidden = isKorean;
  if (isKorean) replyTranslation.hidden = true;
}

function setLoading(isLoading) {
  requestStatus.textContent = isLoading ? "선택한 말투로 문장을 준비하고 있어요." : "";
  requestStatus.classList.toggle("loading", isLoading);
  messageResult.setAttribute("aria-busy", String(isLoading));
  document.querySelectorAll('input[name="tone"]').forEach((input) => {
    input.disabled = isLoading;
  });
}

function renderReplyAnalysis(analysis) {
  const label = CLASSIFICATION_LABELS[analysis.classification] || {
    title: "답변을 추가로 확인해야 해요",
    badge: "확인 필요",
  };
  document.querySelector("#classification-label").textContent = label.title;
  document.querySelector("#classification-badge").textContent = label.badge;
  fillList(document.querySelector("#answered-list"), analysis.answered_items || ["아직 확인된 항목이 없어요"]);
  fillList(document.querySelector("#unanswered-list"), analysis.unanswered_items || []);
  document.querySelector("#follow-up-korean").textContent = analysis.follow_up_korean;
  document.querySelector("#translated-follow-up").textContent = analysis.translated_follow_up;
  translatedEmployerReply.textContent = analysis.translated_reply || employerReply.value;
  replyTranslation.hidden = selectedLanguage === "ko";

  const context = document.querySelector("#analysis-context");
  context.hidden = false;
  document.querySelector("#evidence-check").textContent = analysis.evidence_check?.explanation || "등록된 기록을 함께 확인했어요.";
  fillList(
    document.querySelector("#tactic-list"),
    (analysis.tactics || []).map((item) => `${TACTIC_LABELS[item.type] || "확인 필요"}: ${item.explanation}`),
  );
  const safety = document.querySelector("#safety-note");
  safety.hidden = !analysis.safety_mode;
  safety.textContent = analysis.safety_note || "";
}

function formatHistoryTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderHistory(messages) {
  historyCount.textContent = `${messages.length.toLocaleString()}개`;
  historyEmpty.hidden = messages.length > 0;
  historyList.replaceChildren(
    ...messages.map((message) => {
      const item = document.createElement("li");
      const sender = message.sender === "employer" ? "employer" : "assistant";
      item.className = `history-message history-message--${sender}`;

      const meta = document.createElement("div");
      meta.className = "history-message__meta";
      const label = document.createElement("span");
      const condition = CONDITION_LABELS[message.analysis?.condition_type];
      const senderLabels = HISTORY_SENDER_LABELS[selectedLanguage] || HISTORY_SENDER_LABELS.ko;
      label.textContent = sender === "employer"
        ? senderLabels.employer
        : `${senderLabels.assistant}${condition ? ` · ${condition}` : ""}`;
      const time = document.createElement("time");
      time.dateTime = message.created_at || "";
      time.textContent = formatHistoryTime(message.created_at);
      meta.append(label, time);

      const text = document.createElement("p");
      text.textContent = message.original_text;
      item.append(meta, text);
      return item;
    }),
  );
}

async function loadMessage(tone) {
  const currentRequest = ++requestSequence;
  selectedTone = tone;
  setLoading(true);
  errorState.hidden = true;
  messageResult.hidden = false;
  actionFeedback.textContent = "";
  try {
    let message;
    if (useMockData) {
      message = structuredClone(MOCK_RESPONSES[tone]);
      message.translated_text = MOCK_TRANSLATIONS[selectedLanguage].message[tone];
    } else {
      message = await fetchJson("/conversations/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...MESSAGE_REQUEST, tone }),
      });
    }
    if (currentRequest !== requestSequence) return;
    currentMessage = message;
    renderMessage(message);
    historyStatus.textContent = "추천문은 아직 대화 기록에 저장되지 않았어요.";
  } catch (error) {
    if (currentRequest !== requestSequence) return;
    currentMessage = null;
    messageResult.hidden = true;
    errorMessage.textContent = error.message;
    errorState.hidden = false;
  } finally {
    if (currentRequest === requestSequence) setLoading(false);
  }
}

async function loadHistory() {
  if (useMockData) {
    renderHistory(mockHistory);
    return;
  }
  try {
    const history = await fetchJson(
      `/conversations/${encodeURIComponent(comparisonId)}/history?workplace_id=${encodeURIComponent(workplaceId)}`,
    );
    if (history.messages.length > 0) {
      historyStatus.textContent = `이전 대화 ${history.messages.length}개를 불러왔어요. 남은 질문부터 이어서 확인합니다.`;
    }
    renderHistory(history.messages);
  } catch (error) {
    if (error.code === "CONVERSATION_NOT_FOUND") {
      renderHistory([]);
      return;
    }
    historyStatus.textContent = "대화 기록을 불러오지 못했어요.";
  }
}

function updateSentMessageCount() {
  sentMessageCount.textContent = `${sentMessageText.value.length.toLocaleString()} / 2,000`;
}

async function recordSentMessage() {
  const originalText = sentMessageText.value.trim();
  if (!originalText) {
    actionFeedback.textContent = "실제로 보낸 카카오톡 문장을 먼저 입력해 주세요.";
    sentMessageText.focus();
    return;
  }

  recordSentMessageButton.disabled = true;
  actionFeedback.textContent = "보낸 문장을 대화 기록에 저장하고 있어요.";
  try {
    if (useMockData) {
      mockHistory.push({
        message_id: `msg_mock_${Date.now()}`,
        sender: "assistant",
        original_text: originalText,
        translated_text: null,
        analysis: { condition_type: "hourly_wage", message_type: "sent" },
        created_at: new Date().toISOString(),
      });
    } else {
      await fetchJson("/conversations/sent-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workplace_id: workplaceId,
          comparison_id: comparisonId,
          original_text: originalText,
          translated_text: originalText === currentMessage?.korean_text
            ? currentMessage.translated_text
            : null,
          tone: selectedTone,
        }),
      });
    }
    sentMessageText.value = "";
    updateSentMessageCount();
    actionFeedback.textContent = "실제로 보낸 카카오톡 문장을 기록했어요.";
    historyStatus.textContent = "이 사업장의 모든 확인 대화를 한 타임라인에 보관합니다.";
    await loadHistory();
  } catch (error) {
    actionFeedback.textContent = error.message;
  } finally {
    recordSentMessageButton.disabled = false;
  }
}

async function copyCurrentMessage() {
  if (!currentMessage) return;
  try {
    await navigator.clipboard.writeText(currentMessage.korean_text);
    actionFeedback.textContent = "한국어 문장을 복사했어요.";
  } catch {
    actionFeedback.textContent = "복사하지 못했어요. 문장을 직접 선택해 복사해 주세요.";
  }
}

function updateReplyCount() {
  replyCharacterCount.textContent = `${employerReply.value.length.toLocaleString()} / 2,000`;
}

function showAnalysisState(state) {
  analysisEmpty.hidden = state !== "empty";
  analysisLoading.hidden = state !== "loading";
  analysisError.hidden = state !== "error";
  analysisResult.hidden = state !== "result";
  analyzeReplyButton.disabled = state === "loading";
}

async function analyzeEmployerReply() {
  const replyText = employerReply.value.trim();
  if (!replyText) {
    document.querySelector("#analysis-error-message").textContent = "고용주의 답변을 먼저 입력해 주세요.";
    showAnalysisState("error");
    employerReply.focus();
    return;
  }
  showAnalysisState("loading");
  analysisBadge.textContent = "분석 중";
  analysisBadge.classList.remove("complete");
  try {
    let analysis;
    if (useMockData) {
      analysis = structuredClone(MOCK_REPLY_ANALYSIS);
      analysis.translated_reply = MOCK_TRANSLATIONS[selectedLanguage].employerReply;
      analysis.translated_follow_up = MOCK_TRANSLATIONS[selectedLanguage].followUp;
    } else {
      analysis = await fetchJson("/conversations/reply-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workplace_id: workplaceId,
          comparison_id: comparisonId,
          reply_text: replyText,
          original_language: MESSAGE_REQUEST.user_language,
          tone: selectedTone,
        }),
      });
    }
    currentReplyAnalysis = analysis;
    renderReplyAnalysis(analysis);
    showAnalysisState("result");
    analysisBadge.textContent = analysis.safety_mode ? "안전 확인" : "확인 완료";
    analysisBadge.classList.add("complete");
    historyStatus.textContent = "고용주 답변을 저장했어요. 후속 문장은 실제로 보낸 뒤 기록해 주세요.";
    await loadHistory();
  } catch (error) {
    currentReplyAnalysis = null;
    document.querySelector("#analysis-error-message").textContent = error.message;
    showAnalysisState("error");
    analysisBadge.textContent = "분석 실패";
  }
}

document.querySelectorAll('input[name="tone"]').forEach((input) => {
  input.addEventListener("change", () => loadMessage(input.value));
});
languageSelect.addEventListener("change", () => {
  selectedLanguage = languageSelect.value;
  MESSAGE_REQUEST.user_language = selectedLanguage;
  writeSessionValue("user_language", selectedLanguage);
  writeSessionValue("site_display_language_v2", selectedLanguage);
  document.dispatchEvent(new CustomEvent("userlanguagechange", {
    detail: { language: selectedLanguage },
  }));
  updateLanguageDisplay(selectedLanguage);
  loadHistory();
  if (useMockData && currentReplyAnalysis) {
    currentReplyAnalysis.translated_reply = MOCK_TRANSLATIONS[selectedLanguage].employerReply;
    currentReplyAnalysis.translated_follow_up = MOCK_TRANSLATIONS[selectedLanguage].followUp;
    renderReplyAnalysis(currentReplyAnalysis);
  }
  loadMessage(selectedTone);
});
document.querySelector("#copy-message").addEventListener("click", copyCurrentMessage);
document.querySelector("#use-suggested-message").addEventListener("click", () => {
  if (!currentMessage) return;
  sentMessageText.value = currentMessage.korean_text;
  updateSentMessageCount();
  sentMessageText.focus();
  actionFeedback.textContent = "추천문을 가져왔어요. 실제 보낸 내용과 같게 수정해 주세요.";
});
sentMessageText.addEventListener("input", updateSentMessageCount);
recordSentMessageButton.addEventListener("click", recordSentMessage);
document.querySelector("#retry-button").addEventListener("click", () => loadMessage(selectedTone));
employerReply.addEventListener("input", updateReplyCount);
document.querySelector("#load-example-reply").addEventListener("click", () => {
  employerReply.value = "수습기간이라 원래 그렇게 계산해요.";
  updateReplyCount();
  employerReply.focus();
});
analyzeReplyButton.addEventListener("click", analyzeEmployerReply);
document.querySelector("#retry-analysis").addEventListener("click", analyzeEmployerReply);
document.querySelector("#copy-follow-up").addEventListener("click", async () => {
  if (!currentReplyAnalysis) return;
  try {
    await navigator.clipboard.writeText(currentReplyAnalysis.follow_up_korean);
    analysisFeedback.textContent = "후속 확인 문장을 복사했어요.";
  } catch {
    analysisFeedback.textContent = "복사하지 못했어요. 문장을 직접 선택해 복사해 주세요.";
  }
});

updateSentMessageCount();
loadHistory();
updateLanguageDisplay(selectedLanguage);
loadMessage(selectedTone);
