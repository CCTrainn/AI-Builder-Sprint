const params = new URLSearchParams(window.location.search);
const workplaceId = params.get("workplace_id") || sessionStorage.getItem("workplace_id") || "demo-e2e";
const userLanguage = sessionStorage.getItem("user_language") || "ko";
const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const apiBase = isLocal
  ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
  : `${window.location.origin}/api/v1`;

const thread = document.querySelector("#guided-chat-thread");
const emptyState = document.querySelector("#guided-chat-empty");
const coachTitle = document.querySelector("#coach-title");
const coachContent = document.querySelector("#coach-content");
const coachFeedback = document.querySelector("#coach-feedback");

let comparison = null;
let suggestion = null;
let selectedTone = "polite";

const labels = {
  hourly_wage: "시급",
  weekly_holiday_pay: "주휴수당",
  working_hours: "근무시간",
  break_time: "휴게시간",
  pay_date: "급여일",
};

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) throw new Error(body?.error?.message || "잠시 후 다시 시도해 주세요.");
  return body.data;
}

function button(text, onClick, className = "coach-choice") {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = text;
  element.addEventListener("click", onClick);
  return element;
}

function setCoach(title, ...children) {
  coachTitle.textContent = title;
  coachContent.replaceChildren(...children);
  coachFeedback.textContent = "";
}

function addBubble(side, speaker, text) {
  emptyState.hidden = true;
  const item = document.createElement("article");
  item.className = `chat-bubble chat-bubble--${side}`;
  const name = document.createElement("span");
  name.textContent = speaker;
  const content = document.createElement("p");
  content.textContent = text;
  item.append(name, content);
  thread.append(item);
  thread.scrollTop = thread.scrollHeight;
}

function showIssueChoices(comparisons) {
  const choices = comparisons.filter((item) => item.status === "different");
  const group = document.createElement("div");
  group.className = "coach-choices";
  choices.forEach((item) => group.append(button(labels[item.condition] || item.condition, () => chooseIssue(item))));
  setCoach("무슨 내용을 물어볼까요?", group);
}

function chooseIssue(item) {
  comparison = item;
  const group = document.createElement("div");
  group.className = "coach-choices";
  [["정중하게", "polite"], ["명확하게", "clear"], ["단호하게", "firm"]]
    .forEach(([text, tone]) => group.append(button(text, () => loadSuggestion(tone))));
  setCoach(`${labels[item.condition] || item.condition}에 대해 어떤 말투로 물어볼까요?`, group);
}

async function loadSuggestion(tone) {
  selectedTone = tone;
  setCoach("보낼 문장을 준비하고 있어요.", Object.assign(document.createElement("div"), { className: "coach-loading", textContent: "잠시만 기다려 주세요…" }));
  try {
    suggestion = await request("/conversations/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workplace_id: workplaceId, comparison_id: comparison.comparison_id, tone, user_language: userLanguage }),
    });
    showSuggestion(suggestion.korean_text);
  } catch (error) {
    setCoach("문장을 만들지 못했어요.", button("다시 시도", () => loadSuggestion(tone)));
    coachFeedback.textContent = error.message;
  }
}

function showSuggestion(text, contextText = "", titleText = "") {
  const elements = [];
  if (contextText) {
    const context = document.createElement("p");
    context.className = "coach-analysis";
    context.textContent = contextText;
    elements.push(context);
  }
  const editGuide = document.createElement("label");
  editGuide.className = "coach-edit-guide";
  editGuide.textContent = "LLM이 만든 초안이에요. 실제 말투에 맞게 자유롭게 고쳐서 보내세요.";
  const preview = document.createElement("textarea");
  preview.className = "coach-draft";
  preview.rows = 4;
  preview.maxLength = 2000;
  preview.value = text;
  const actions = document.createElement("div");
  actions.className = "coach-actions";
  actions.append(button("수정한 문장을 실제로 보냈어요", () => confirmSent(preview), "coach-primary"));
  if (!titleText) {
    [["정중", "polite"], ["명확", "clear"], ["단호", "firm"]].forEach(([label, tone]) => {
      const toneButton = button(label, () => loadSuggestion(tone), "coach-secondary");
      toneButton.classList.toggle("is-active", tone === selectedTone);
      actions.append(toneButton);
    });
  }
  const details = document.createElement("details");
  details.className = "coach-details";
  const summary = document.createElement("summary");
  summary.textContent = "이 문장을 추천한 기록 근거";
  const list = document.createElement("ul");
  (suggestion.basis || []).forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    list.append(item);
  });
  details.append(summary, list);
  elements.push(editGuide, preview, actions, details);
  setCoach(titleText || (contextText ? "이어서 이렇게 답해보세요." : "이렇게 물어보는 건 어떨까요?"), ...elements);
}

async function confirmSent(draftInput) {
  const finalText = draftInput.value.trim();
  if (!finalText) {
    coachFeedback.textContent = "실제로 보낼 문장을 입력해 주세요.";
    draftInput.focus();
    return;
  }
  try {
    await request("/conversations/sent-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workplace_id: workplaceId,
        comparison_id: comparison.comparison_id,
        original_text: finalText,
        translated_text: finalText === suggestion.korean_text ? suggestion.translated_text : null,
        tone: selectedTone,
      }),
    });
    addBubble("me", "나", finalText);
    showReplyInput();
  } catch (error) {
    coachFeedback.textContent = error.message;
  }
}

function showReplyInput() {
  const input = document.createElement("textarea");
  input.rows = 4;
  input.maxLength = 2000;
  input.placeholder = "사장님이 보낸 답변을 복사해서 붙여넣어 주세요.";
  const submit = button("답변 붙여넣기 완료", () => analyzeReply(input), "coach-primary");
  setCoach("사장님에게 답장이 왔나요?", input, submit);
  input.focus();
}

async function analyzeReply(input) {
  const replyText = input.value.trim();
  if (!replyText) {
    coachFeedback.textContent = "사장님의 답변을 먼저 붙여넣어 주세요.";
    input.focus();
    return;
  }
  addBubble("employer", "사장님", replyText);
  setCoach("답변을 확인하고 있어요.", Object.assign(document.createElement("div"), { className: "coach-loading", textContent: "답변된 내용과 다음 질문을 나누고 있어요…" }));
  try {
    const analysis = await request("/conversations/reply-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workplace_id: workplaceId, comparison_id: comparison.comparison_id, reply_text: replyText, original_language: userLanguage, tone: selectedTone }),
    });
    showAnalysis(analysis);
  } catch (error) {
    setCoach("답변을 분석하지 못했어요.", button("다시 입력하기", showReplyInput));
    coachFeedback.textContent = error.message;
  }
}

function showAnalysis(analysis) {
  const unanswered = analysis.unanswered_items || [];
  if (!unanswered.length || analysis.classification === "fully_answered") {
    const summary = document.createElement("p");
    summary.className = "coach-analysis";
    summary.textContent = "질문한 내용에 답변을 받았어요. 다른 문제를 확인하거나 추가 답변을 이어서 붙여넣을 수 있어요.";
    const actions = document.createElement("div");
    actions.className = "coach-actions";
    actions.append(
      button("다른 문제 확인하기", loadIssues, "coach-secondary"),
      button("사장님 답변 더 붙여넣기", showReplyInput, "coach-secondary"),
    );
    setCoach("답변을 확인했어요.", summary, actions);
    return;
  }
  suggestion = { korean_text: analysis.follow_up_korean, translated_text: analysis.translated_follow_up, basis: [] };
  showSuggestion(analysis.follow_up_korean, "", "사장님께 이렇게 답해보세요.");
}

async function loadIssues() {
  try {
    const result = await request(`/workplaces/${encodeURIComponent(workplaceId)}/compare`, { method: "POST" });
    showIssueChoices(result.comparisons || []);
  } catch (error) {
    setCoach("확인할 문제를 불러오지 못했어요.", button("다시 시도", loadIssues));
    coachFeedback.textContent = error.message;
  }
}

function showGreeting() {
  const greeting = "사장님, 안녕하세요. 잠깐 확인드릴 내용이 있어서 연락드렸습니다.";
  const guide = document.createElement("label");
  guide.className = "coach-edit-guide";
  guide.textContent = "인사말도 평소 말투대로 수정할 수 있어요.";
  const preview = document.createElement("textarea");
  preview.className = "coach-draft";
  preview.rows = 3;
  preview.maxLength = 500;
  preview.value = greeting;
  const actions = document.createElement("div");
  actions.className = "coach-actions";
  actions.append(
    button("이 인사를 실제로 보냈어요", () => {
      const finalGreeting = preview.value.trim();
      if (!finalGreeting) {
        coachFeedback.textContent = "보낼 인사말을 입력하거나 ‘인사 없이 바로 시작’을 선택해 주세요.";
        preview.focus();
        return;
      }
      addBubble("me", "나", finalGreeting);
      loadIssues();
    }, "coach-primary"),
    button("인사 없이 바로 시작", loadIssues, "coach-secondary"),
  );
  setCoach("먼저 가볍게 인사하고 시작할까요?", guide, preview, actions);
}

showGreeting();
