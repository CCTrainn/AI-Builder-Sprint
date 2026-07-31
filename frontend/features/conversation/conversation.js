const pageParams = new URLSearchParams(window.location.search);
const comparisonId = pageParams.get("comparison_id") || "cmp_001";

const MESSAGE_REQUEST = {
  workplace_id: "work_001",
  comparison_id: comparisonId,
  tone: "polite",
  user_language: "vi",
};

// 백엔드 연결 전 화면 개발을 위한 API 계약 형식의 예시 응답입니다.
const MOCK_RESPONSES = {
  polite: {
    success: true,
    data: {
      message_id: "msg_001",
      korean_text: "계약서와 급여명세서의 시급이 다른데 계산 근거를 확인해 주실 수 있을까요?",
      translated_text: "Mức lương theo giờ trong hợp đồng và phiếu lương khác nhau. Anh/chị có thể giúp tôi kiểm tra căn cứ tính lương được không?",
      basis: ["계약서 시급 12,000원", "급여명세서 시급 10,500원"],
    },
    error: null,
  },
  clear: {
    success: true,
    data: {
      message_id: "msg_002",
      korean_text: "계약서에는 시급 12,000원, 급여명세서에는 10,500원으로 기록되어 있습니다. 수습기간의 적용 여부와 기간, 계산 근거를 알려주세요.",
      translated_text: "Hợp đồng ghi 12.000 won/giờ, nhưng phiếu lương ghi 10.500 won/giờ. Xin hãy cho tôi biết có áp dụng thử việc hay không, thời gian áp dụng và căn cứ tính lương.",
      basis: ["계약서 시급 12,000원", "급여명세서 시급 10,500원"],
    },
    error: null,
  },
  firm: {
    success: true,
    data: {
      message_id: "msg_003",
      korean_text: "계약서의 시급 12,000원과 급여명세서의 계산 시급 10,500원이 다릅니다. 수습기간의 합의 내용과 적용 기간, 10,500원의 계산 근거를 서면으로 답변해 주세요.",
      translated_text: "Mức lương 12.000 won/giờ trong hợp đồng khác với mức 10.500 won/giờ trên phiếu lương. Xin hãy trả lời bằng văn bản về nội dung thỏa thuận thử việc, thời gian áp dụng và căn cứ tính mức 10.500 won.",
      basis: ["계약서 시급 12,000원", "급여명세서 시급 10,500원"],
    },
    error: null,
  },
};

const MOCK_REPLY_ANALYSIS = {
  success: true,
  data: {
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
  error: null,
};

const CLASSIFICATION_LABELS = {
  fully_answered: { title: "질문한 내용이 모두 답변되었어요", badge: "전체 답변" },
  partly_answered: { title: "일부만 답변되었어요", badge: "부분 답변" },
  not_answered: { title: "질문한 내용이 답변되지 않았어요", badge: "미답변" },
  unclear: { title: "답변의 의미를 더 확인해야 해요", badge: "불명확" },
  new_condition: { title: "새로운 조건이 답변에 포함되어 있어요", badge: "새 조건" },
  more_evidence_needed: { title: "확인할 기록이 더 필요해요", badge: "자료 필요" },
};

const DEMO_RECORD_KEY = "work-rights-companion:conversation-demo";

const koreanText = document.querySelector("#korean-text");
const translatedText = document.querySelector("#translated-text");
const basisList = document.querySelector("#basis-list");
const messageResult = document.querySelector("#message-result");
const requestStatus = document.querySelector("#request-status");
const errorState = document.querySelector("#error-state");
const errorMessage = document.querySelector("#error-message");
const actionFeedback = document.querySelector("#action-feedback");

let selectedTone = MESSAGE_REQUEST.tone;
let currentMessage = null;
let requestSequence = 0;
let currentReplyAnalysis = null;

function getMockMessage(request) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      const response = MOCK_RESPONSES[request.tone];

      if (!response || response.success === false) {
        reject(new Error(response?.error?.message || "추천 문장을 준비하지 못했습니다."));
        return;
      }

      resolve(response.data);
    }, 320);
  });
}

function getMockReplyAnalysis(request) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (!request.reply_text.trim()) {
        reject(new Error("고용주의 답변을 먼저 입력해 주세요."));
        return;
      }

      if (MOCK_REPLY_ANALYSIS.success === false) {
        reject(new Error(MOCK_REPLY_ANALYSIS.error?.message || "답변을 분석하지 못했습니다."));
        return;
      }

      resolve(MOCK_REPLY_ANALYSIS.data);
    }, 520);
  });
}

function renderMessage(message) {
  koreanText.textContent = message.korean_text;
  translatedText.textContent = message.translated_text;
  basisList.replaceChildren(
    ...message.basis.map((basis) => {
      const item = document.createElement("li");
      item.textContent = basis;
      return item;
    }),
  );
}

function setLoading(isLoading) {
  requestStatus.textContent = isLoading ? "선택한 말투로 문장을 준비하고 있어요." : "";
  requestStatus.classList.toggle("loading", isLoading);
  messageResult.setAttribute("aria-busy", String(isLoading));
  document.querySelectorAll('input[name="tone"]').forEach((input) => {
    input.disabled = isLoading;
  });
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

function renderReplyAnalysis(analysis) {
  const label = CLASSIFICATION_LABELS[analysis.classification] || {
    title: "답변을 추가로 확인해야 해요",
    badge: "확인 필요",
  };

  document.querySelector("#classification-label").textContent = label.title;
  document.querySelector("#classification-badge").textContent = label.badge;
  fillList(document.querySelector("#answered-list"), analysis.answered_items);
  fillList(document.querySelector("#unanswered-list"), analysis.unanswered_items);
  document.querySelector("#follow-up-korean").textContent = analysis.follow_up_korean;
  document.querySelector("#translated-follow-up").textContent = analysis.translated_follow_up;
}

function saveDemoConversation(replyText, analysis) {
  const demoRecord = {
    saved_at: new Date().toISOString(),
    workplace_id: MESSAGE_REQUEST.workplace_id,
    comparison_id: MESSAGE_REQUEST.comparison_id,
    issue: {
      condition: "hourly_wage",
      summary: "계약 시급과 급여 계산 시급이 1,500원 다릅니다.",
      promised_value: 12000,
      actual_value: 10500,
    },
    message: currentMessage,
    employer_reply: replyText,
    analysis,
  };

  try {
    window.localStorage.setItem(DEMO_RECORD_KEY, JSON.stringify(demoRecord));
  } catch {
    // 저장소를 사용할 수 없어도 현재 분석 결과는 계속 보여줍니다.
  }
}

async function loadMessage(tone) {
  const currentRequest = ++requestSequence;
  selectedTone = tone;
  setLoading(true);
  errorState.hidden = true;
  messageResult.hidden = false;
  actionFeedback.textContent = "";

  try {
    const message = await getMockMessage({ ...MESSAGE_REQUEST, tone });
    if (currentRequest !== requestSequence) return;

    currentMessage = message;
    renderMessage(message);
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

async function copyCurrentMessage() {
  if (!currentMessage) return;

  try {
    await navigator.clipboard.writeText(currentMessage.korean_text);
    actionFeedback.textContent = "한국어 문장을 복사했어요.";
  } catch {
    actionFeedback.textContent = "복사하지 못했어요. 문장을 직접 선택해 복사해 주세요.";
  }
}

document.querySelectorAll('input[name="tone"]').forEach((input) => {
  input.addEventListener("change", () => loadMessage(input.value));
});

document.querySelector("#copy-message").addEventListener("click", copyCurrentMessage);
document.querySelector("#retry-button").addEventListener("click", () => loadMessage(selectedTone));

const employerReply = document.querySelector("#employer-reply");
const replyCharacterCount = document.querySelector("#reply-character-count");
const analyzeReplyButton = document.querySelector("#analyze-reply");
const analysisEmpty = document.querySelector("#analysis-empty");
const analysisLoading = document.querySelector("#analysis-loading");
const analysisError = document.querySelector("#analysis-error");
const analysisResult = document.querySelector("#analysis-result");
const analysisBadge = document.querySelector(".analysis-badge");
const analysisFeedback = document.querySelector("#analysis-feedback");

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
    const analysis = await getMockReplyAnalysis({
      comparison_id: MESSAGE_REQUEST.comparison_id,
      reply_text: replyText,
      original_language: "ko",
    });
    currentReplyAnalysis = analysis;
    renderReplyAnalysis(analysis);
    saveDemoConversation(replyText, analysis);
    showAnalysisState("result");
    analysisBadge.textContent = "확인 필요";
    analysisBadge.classList.add("complete");
  } catch (error) {
    currentReplyAnalysis = null;
    document.querySelector("#analysis-error-message").textContent = error.message;
    showAnalysisState("error");
    analysisBadge.textContent = "분석 실패";
  }
}

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

loadMessage(selectedTone);
