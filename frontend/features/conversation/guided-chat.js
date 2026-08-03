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
const clearConversationButton = document.querySelector("#clear-conversation");

let comparison = null;
let suggestion = null;
let selectedTone = "polite";
let availableComparisons = [];
let pendingGreeting = localStorage.getItem(`daekku:greeting:${workplaceId}`) || "";
let pendingGreetingBubble = null;
let restoredMessages = [];
let visibleHistoryCount = 20;
let activeConversationId = null;

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
  element.addEventListener("click", async () => {
    if (element.disabled) return;
    element.disabled = true;
    try {
      await onClick();
    } finally {
      element.disabled = false;
    }
  });
  return element;
}

function setCoach(title, ...children) {
  coachTitle.textContent = title;
  coachContent.replaceChildren(...children);
  coachFeedback.textContent = "";
}

function addBubble(side, speaker, text, messageId = null, sender = null) {
  emptyState.hidden = true;
  const item = document.createElement("article");
  item.className = `chat-bubble chat-bubble--${side}`;
  const name = document.createElement("span");
  name.textContent = speaker;
  const content = document.createElement("p");
  content.textContent = text;
  item.append(name, content);
  if (messageId) attachBubbleControls(item, content, messageId, sender || side);
  thread.append(item);
  if (messageId && activeConversationId) clearConversationButton.disabled = false;
  thread.scrollTop = thread.scrollHeight;
  return item;
}

clearConversationButton.addEventListener("click", async () => {
  if (!activeConversationId) return;
  if (!window.confirm("현재 채팅의 대화를 모두 삭제할까요? 삭제하면 AI도 이 대화를 더 이상 기억하지 못하며 복구할 수 없습니다.")) return;
  clearConversationButton.disabled = true;
  try {
    await request(`/conversations/${encodeURIComponent(activeConversationId)}/messages?workplace_id=${encodeURIComponent(workplaceId)}`, {
      method: "DELETE",
    });
    restoredMessages = [];
    visibleHistoryCount = 20;
    comparison = null;
    suggestion = null;
    pendingGreeting = "";
    pendingGreetingBubble = null;
    localStorage.removeItem(`daekku:greeting:${workplaceId}`);
    thread.querySelectorAll(".chat-bubble, .chat-history-more").forEach((item) => item.remove());
    emptyState.hidden = false;
    await showGreeting();
    coachFeedback.textContent = "대화가 모두 삭제됐어요. AI도 새 대화로 시작합니다.";
  } catch (error) {
    coachFeedback.textContent = error.message;
    clearConversationButton.disabled = false;
  }
});

function renderRestoredMessages() {
  thread.querySelectorAll(".chat-bubble, .chat-history-more").forEach((item) => item.remove());
  const start = Math.max(0, restoredMessages.length - visibleHistoryCount);
  if (start > 0) {
    const more = button(`이전 대화 ${start}개 더 보기`, () => {
      visibleHistoryCount += 20;
      renderRestoredMessages();
    }, "chat-history-more");
    thread.append(more);
  }
  restoredMessages.slice(start).forEach((message) => {
    addBubble(
      message.sender === "employer" ? "employer" : "me",
      message.sender === "employer" ? "사장님" : "나",
      message.original_text,
      message.message_id,
      message.sender,
    );
  });
}

function attachBubbleControls(item, content, messageId, sender) {
  if (item.querySelector(".chat-bubble__actions")) return;
  item.dataset.messageId = messageId;
  item.dataset.sender = sender;
  const actions = document.createElement("div");
  actions.className = "chat-bubble__actions";
  actions.append(
    button("수정", async () => {
      const edited = window.prompt("대화 내용을 수정하세요.", content.textContent);
      if (edited === null || !edited.trim() || edited.trim() === content.textContent) return;
      try {
        if (sender === "employer") {
          const analysis = await request("/conversations/reply-analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workplace_id: workplaceId,
              comparison_id: comparison.comparison_id,
              message_id: messageId,
              reply_text: edited.trim(),
              original_language: userLanguage,
              tone: selectedTone,
            }),
          });
          content.textContent = edited.trim();
          const stored = restoredMessages.find((message) => message.message_id === messageId);
          if (stored) stored.original_text = edited.trim();
          showAnalysis(analysis);
        } else {
          await request(`/conversations/messages/${encodeURIComponent(messageId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workplace_id: workplaceId, original_text: edited.trim() }),
          });
          content.textContent = edited.trim();
          const stored = restoredMessages.find((message) => message.message_id === messageId);
          if (stored) stored.original_text = edited.trim();
          await reanalyzeLatestEmployerMessage();
          coachFeedback.textContent = "수정된 전체 대화를 AI가 다시 읽었어요.";
        }
      } catch (error) {
        coachFeedback.textContent = error.message;
      }
    }, "chat-bubble__action"),
    button("삭제", async () => {
      if (!window.confirm("이 대화를 삭제할까요? 삭제한 내용은 AI 대화 맥락에서도 제외됩니다.")) return;
      try {
        await request(`/conversations/messages/${encodeURIComponent(messageId)}?workplace_id=${encodeURIComponent(workplaceId)}`, {
          method: "DELETE",
        });
        item.remove();
        restoredMessages = restoredMessages.filter((message) => message.message_id !== messageId);
        await reanalyzeLatestEmployerMessage();
      } catch (error) {
        coachFeedback.textContent = error.message;
      }
    }, "chat-bubble__action"),
  );
  item.append(actions);
}

async function reanalyzeLatestEmployerMessage() {
  if (!comparison) return;
  const employerBubbles = [...thread.querySelectorAll('.chat-bubble[data-sender="employer"]')];
  const latest = employerBubbles.at(-1);
  if (!latest?.dataset.messageId) return;
  const replyText = latest.querySelector("p")?.textContent?.trim();
  if (!replyText) return;
  const analysis = await request("/conversations/reply-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workplace_id: workplaceId,
      comparison_id: comparison.comparison_id,
      message_id: latest.dataset.messageId,
      reply_text: replyText,
      original_language: userLanguage,
      tone: selectedTone,
    }),
  });
  showAnalysis(analysis);
}

function showIssueChoices(comparisons) {
  const choices = comparisons.filter((item) => item.status === "different");
  const group = document.createElement("div");
  group.className = "coach-choices";
  choices.forEach((item) => group.append(button(labels[item.condition] || item.condition, () => chooseIssue(item))));
  setCoach("무슨 내용을 물어볼까요?", group);
}

async function chooseIssue(item) {
  comparison = item;
  if (pendingGreeting) {
    try {
      const savedGreeting = await request("/conversations/sent-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workplace_id: workplaceId,
          comparison_id: item.comparison_id,
          original_text: pendingGreeting,
          translated_text: null,
          tone: selectedTone,
          message_type: "greeting",
        }),
      });
      activeConversationId = savedGreeting.conversation_id;
      if (pendingGreetingBubble) {
        attachBubbleControls(
          pendingGreetingBubble,
          pendingGreetingBubble.querySelector("p"),
          savedGreeting.message_id,
          "assistant",
        );
      }
      restoredMessages.push({
        message_id: savedGreeting.message_id,
        sender: "assistant",
        original_text: pendingGreeting,
        analysis: { message_type: "greeting", comparison_id: item.comparison_id, tone: selectedTone },
      });
      pendingGreeting = "";
      localStorage.removeItem(`daekku:greeting:${workplaceId}`);
    } catch (error) {
      coachFeedback.textContent = "인사말 저장은 잠시 후 다시 시도할게요.";
    }
  }
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
    const saved = await request("/conversations/sent-message", {
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
    activeConversationId = saved.conversation_id;
    clearConversationButton.disabled = false;
    addBubble("me", "나", finalText, saved.message_id, "assistant");
    restoredMessages.push({
      message_id: saved.message_id,
      sender: "assistant",
      original_text: finalText,
      analysis: { message_type: "sent", comparison_id: comparison.comparison_id, tone: selectedTone },
    });
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
  const employerBubble = addBubble("employer", "사장님", replyText);
  setCoach("답변을 확인하고 있어요.", Object.assign(document.createElement("div"), { className: "coach-loading", textContent: "답변된 내용과 다음 질문을 나누고 있어요…" }));
  try {
    const analysis = await request("/conversations/reply-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workplace_id: workplaceId, comparison_id: comparison.comparison_id, reply_text: replyText, original_language: userLanguage, tone: selectedTone }),
    });
    activeConversationId = analysis.conversation_id;
    clearConversationButton.disabled = false;
    attachBubbleControls(
      employerBubble,
      employerBubble.querySelector("p"),
      analysis.reply_id,
      "employer",
    );
    restoredMessages.push({
      message_id: analysis.reply_id,
      sender: "employer",
      original_text: replyText,
      analysis,
    });
    showAnalysis(analysis);
  } catch (error) {
    setCoach("답변을 분석하지 못했어요.", button("다시 입력하기", showReplyInput));
    coachFeedback.textContent = error.message;
  }
}

function showAnalysis(analysis) {
  const unanswered = analysis.unanswered_items || [];
  suggestion = { korean_text: analysis.follow_up_korean, translated_text: analysis.translated_follow_up, basis: [] };
  const context = analysis.safety_mode
    ? "협박하거나 위축시킬 수 있는 표현이 감지됐어요. 지금은 논쟁보다 원문 보관과 안전 확보를 먼저 안내할게요."
    : unanswered.length
      ? `아직 확인되지 않은 내용이 ${unanswered.length}개 있어요. 답변을 이어서 구체적으로 확인해볼게요.`
      : "질문에는 답을 받았지만 문제가 실제로 해결된 것은 아직 아니에요. 약속한 내용의 이행과 남길 기록까지 확인해볼게요.";
  showSuggestion(analysis.follow_up_korean, context, "다음 조치를 이어가세요.");
  const action = analysis.next_action;
  if (!action) return;
  const card = document.createElement("section");
  card.className = "coach-next-action";
  const label = document.createElement("span");
  label.textContent = "현재 진행 상태";
  const title = document.createElement("strong");
  title.textContent = action.title;
  const description = document.createElement("p");
  description.textContent = action.description;
  card.append(label, title, description);
  if (analysis.rights_assertion_mode) {
    const rights = document.createElement("p");
    rights.className = "coach-next-action__rights";
    rights.textContent = `공식 기준 근거: ${analysis.official_basis_title || "국가법령정보센터 확인 결과"}`;
    card.append(rights);
    if (analysis.official_basis_url) {
      const source = document.createElement("a");
      source.className = "coach-next-action__source";
      source.href = analysis.official_basis_url;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      source.textContent = "공식 법령 원문 확인";
      card.append(source);
    }
  }
  if (action.due_date) {
    const due = document.createElement("p");
    due.className = "coach-next-action__date";
    due.textContent = `다시 확인할 시점: ${action.due_date}`;
    card.append(due);
  }
  (analysis.commitments || []).forEach((commitment) => {
    const item = document.createElement("p");
    item.className = "coach-next-action__commitment";
    item.textContent = `사장님의 약속: ${commitment.action}${commitment.due_date ? ` · ${commitment.due_date}` : ""}`;
    card.append(item);
  });
  const actionButtons = document.createElement("div");
  actionButtons.className = "coach-actions";
  if (analysis.safety_mode) {
    actionButtons.append(button("대화 원문 보관하기", () => {
      window.location.assign(`../records/records.html?workplace_id=${encodeURIComponent(workplaceId)}`);
    }, "coach-primary"));
    const help = document.createElement("p");
    help.className = "coach-next-action__help";
    help.append("즉시 위험하면 ");
    const emergency = document.createElement("a");
    emergency.href = "tel:112";
    emergency.textContent = "112";
    const labor = document.createElement("a");
    labor.href = "https://1350.moel.go.kr/home/hp/main/main.do";
    labor.target = "_blank";
    labor.rel = "noopener noreferrer";
    labor.textContent = "고용노동 상담 1350";
    help.append(emergency, " · ", labor);
    card.append(actionButtons, help);
  } else if (analysis.case_status === "user_confirmation_needed") {
    actionButtons.append(button("실제 기록과 비교하기", () => {
      window.location.assign(`../records/records.html?workplace_id=${encodeURIComponent(workplaceId)}&return_to=conversation&comparison_id=${encodeURIComponent(comparison.comparison_id)}`);
    }, "coach-secondary"));
    actionButtons.append(button("확인 결과 선택하기", () => {
      const choices = document.createElement("div");
      choices.className = "coach-actions";
      const saveResolution = async (outcome) => {
        const result = await request("/conversations/resolution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workplace_id: workplaceId,
            comparison_id: comparison.comparison_id,
            reply_id: analysis.reply_id,
            outcome,
          }),
        });
        const stored = restoredMessages.find((message) => message.message_id === analysis.reply_id);
        if (stored) stored.analysis.user_resolution = outcome;
        if (result.next_url) {
          window.location.assign(result.next_url);
          return;
        }
        showSuggestion(
          analysis.follow_up_korean,
          "아직 해결되지 않은 상태로 저장했어요. 대화와 자료 확인을 계속 이어갑니다.",
          "다음 조치를 이어가세요.",
        );
      };
      choices.append(
        button("모두 반영됐어요", () => saveResolution("resolved"), "coach-primary"),
        button("일부만 반영됐어요", () => saveResolution("partially_resolved"), "coach-secondary"),
        button("반영되지 않았어요", () => saveResolution("unresolved"), "coach-secondary"),
      );
      setCoach("약속이 실제 기록과 상황에 얼마나 반영됐나요?", choices);
    }, "coach-primary"));
    card.append(actionButtons);
  } else if (action.target_url) {
    const actionLabel = action.type === "official_support"
      ? "공식 상담 절차 확인하기"
      : "자료 추가하고 확인하기";
    actionButtons.append(button(actionLabel, () => {
      if (/^https?:\/\//.test(action.target_url)) {
        window.open(action.target_url, "_blank", "noopener,noreferrer");
      } else {
        window.location.assign(`${action.target_url}?workplace_id=${encodeURIComponent(workplaceId)}`);
      }
    }, "coach-primary"));
    card.append(actionButtons);
  } else {
    const guide = document.createElement("p");
    guide.className = "coach-next-action__guide";
    guide.textContent = "지금 할 일: 아래 추천 답장을 확인하고 보내세요.";
    card.append(guide);
  }
  coachContent.prepend(card);
}

async function loadIssues() {
  try {
    const result = await request(`/workplaces/${encodeURIComponent(workplaceId)}/compare`, { method: "POST" });
    availableComparisons = result.comparisons || [];
    showIssueChoices(availableComparisons);
  } catch (error) {
    setCoach("확인할 문제를 불러오지 못했어요.", button("다시 시도", loadIssues));
    coachFeedback.textContent = error.message;
  }
}

async function showGreeting() {
  setCoach("자연스러운 첫 인사를 만들고 있어요.", Object.assign(document.createElement("div"), {
    className: "coach-loading",
    textContent: "앞선 대화 흐름에 맞는 인사말을 준비하고 있어요…",
  }));
  let greeting;
  try {
    const result = await request("/conversations/opening-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workplace_id: workplaceId, tone: selectedTone }),
    });
    greeting = result.korean_text;
  } catch (error) {
    setCoach("인사말을 만들지 못했어요.", button("다시 생성", showGreeting, "coach-primary"));
    coachFeedback.textContent = error.message;
    return;
  }
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
      pendingGreetingBubble = addBubble("me", "나", finalGreeting);
      pendingGreeting = finalGreeting;
      localStorage.setItem(`daekku:greeting:${workplaceId}`, finalGreeting);
      loadIssues();
    }, "coach-primary"),
    button("인사 없이 바로 시작", loadIssues, "coach-secondary"),
  );
  setCoach("먼저 가볍게 인사하고 시작할까요?", guide, preview, actions);
}

async function restoreConversation() {
  try {
    const result = await request(`/workplaces/${encodeURIComponent(workplaceId)}/compare`, { method: "POST" });
    availableComparisons = result.comparisons || [];
    const requestedComparisonId = params.get("comparison_id");
    const probe = availableComparisons.find((item) => item.comparison_id === requestedComparisonId)
      || availableComparisons[0];
    if (!probe) {
      await showGreeting();
      return;
    }
    const history = await request(
      `/conversations/${encodeURIComponent(probe.comparison_id)}/history?workplace_id=${encodeURIComponent(workplaceId)}`,
    );
    if (!(history.messages || []).length) {
      await showGreeting();
      return;
    }

    restoredMessages = history.messages || [];
    activeConversationId = history.conversation_id;
    clearConversationButton.disabled = restoredMessages.length === 0;
    visibleHistoryCount = 20;
    renderRestoredMessages();
    const latestWorker = [...history.messages].reverse().find(
      (message) => message.sender !== "employer" && message.analysis?.comparison_id,
    );
    comparison = availableComparisons.find(
      (item) => item.comparison_id === latestWorker?.analysis?.comparison_id,
    ) || probe;
    selectedTone = latestWorker?.analysis?.tone || selectedTone;
    pendingGreeting = "";
    localStorage.removeItem(`daekku:greeting:${workplaceId}`);

    const lastMessage = history.messages.at(-1);
    if (lastMessage.analysis?.message_type === "greeting") {
      showIssueChoices(availableComparisons);
    } else if (lastMessage.sender === "employer" && lastMessage.analysis?.next_action) {
      showAnalysis(lastMessage.analysis);
    } else {
      showReplyInput();
    }
  } catch (error) {
    if (pendingGreeting) {
      addBubble("me", "나", pendingGreeting);
      await loadIssues();
      return;
    }
    await showGreeting();
  }
}

restoreConversation();
