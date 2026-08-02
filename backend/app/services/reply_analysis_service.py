"""고용주 답변을 답변/부분답변/미답변으로 구조화한다.

담당: ROLE-BE-CONVERSATION
"""

import json
import re
from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.prompts.conversation import FOLLOW_UP_WRITER_SYSTEM_PROMPT, REPLY_ANALYSIS_SYSTEM_PROMPT
from app.schemas.comparisons import ComparisonItem
from app.schemas.conversations import (
    ConversationTactic,
    ConversationTone,
    EmployerClaim,
    EvidenceCheck,
    ReplyAnalysisData,
    ReplyClassification,
    TacticDetection,
)
from app.services.conversation_service import (
    UPSTAGE_CHAT_URL,
    UPSTAGE_MODEL,
    TranslationError,
    translate_confirmation_text,
)

_PHONE_PATTERN = re.compile(r"(?<!\d)01[016789][- ]?\d{3,4}[- ]?\d{4}(?!\d)")
_ID_PATTERN = re.compile(r"(?<!\d)\d{6}[- ]?[1-8]\d{6}(?!\d)")
_EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_LONG_NUMBER_PATTERN = re.compile(r"(?<!\d)\d(?:[- ]?\d){7,15}(?!\d)")


def _mask_private_text(value: str) -> str:
    masked = _EMAIL_PATTERN.sub("[EMAIL]", value)
    masked = _PHONE_PATTERN.sub("[PHONE]", masked)
    masked = _ID_PATTERN.sub("[IDENTIFIER]", masked)
    return _LONG_NUMBER_PATTERN.sub("[LONG_NUMBER]", masked)

TACTIC_PATTERNS: dict[ConversationTactic, tuple[re.Pattern[str], str]] = {
    ConversationTactic.CUSTOMARY_CLAIM: (
        re.compile(r"원래|다\s*그래|관행|보통.*그래"),
        "일반적인 관행이라는 설명은 있었지만, 질문한 개별 계산·합의 근거는 별도로 확인해야 합니다.",
    ),
    ConversationTactic.UNSUPPORTED_LEGAL_CLAIM: (
        re.compile(r"법적으로|불법.*아니|문제없|합법"),
        "법적 문제 여부를 언급했지만, 현재 답변 안에는 이를 뒷받침하는 구체적 근거가 없습니다.",
    ),
    ConversationTactic.BLAME_SHIFTING: (
        re.compile(r"네가.*확인|너.*잘못|네 탓|알아서.*했어야"),
        "질문의 계산·합의 근거 대신 근로자에게 책임을 돌리는 표현이 있습니다.",
    ),
    ConversationTactic.DELAYING: (
        re.compile(r"나중에|다음에|기다려|추후|나중.*처리"),
        "답변 시점을 미루는 표현이 있어, 언제 어떤 자료로 답변할지 확인할 필요가 있습니다.",
    ),
    ConversationTactic.NEW_CONDITION: (
        re.compile(r"수습|공제|벌금|교육비|위약금"),
        "기존 기록에 없는 조건이 새로 언급되었을 수 있어, 계약서나 합의 기록을 확인해야 합니다.",
    ),
    ConversationTactic.INTIMIDATING: (
        re.compile(r"해고|비자.*취소|신고해 봐|일 못 하게|쫓아내|불이익"),
        "질문을 위축시킬 수 있는 표현이 감지되었습니다. 감정적으로 답하기 전에 원문과 시간을 보관하세요.",
    ),
}


class ReplyAnalysisLLMError(RuntimeError):
    """LLM이 답변 분석 JSON을 반환하지 못한 경우."""


def _required_items(comparison: ComparisonItem) -> list[str]:
    items = comparison.legal_reference.rights_check.missing_information
    items = items or comparison.confirmation_items
    return list(dict.fromkeys(items)) or ["현재 적용되는 조건", "계산 또는 변경 근거"]


def _extract_claims(reply_text: str) -> list[EmployerClaim]:
    sentences = [
        sentence.strip() for sentence in re.split(r"[.!?\n]+", reply_text) if sentence.strip()
    ]
    return [EmployerClaim(text=sentence[:240], status="claimed") for sentence in sentences[:5]]


def _keyword_tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[가-힣A-Za-z0-9]{2,}", text)
        if token not in {"확인", "기간", "근거"}
    }


def _rule_based_coverage(reply_text: str, required_items: list[str]) -> tuple[list[str], list[str]]:
    reply_tokens = _keyword_tokens(reply_text)
    answered: list[str] = []
    unanswered: list[str] = []
    for item in required_items:
        item_tokens = _keyword_tokens(item)
        if item_tokens and (
            item_tokens & reply_tokens or any(token in reply_text for token in item_tokens)
        ):
            answered.append(item)
        else:
            unanswered.append(item)
    return answered, unanswered


def _tactics(reply_text: str, required_items: list[str]) -> list[TacticDetection]:
    found: list[TacticDetection] = []
    for tactic, (pattern, explanation) in TACTIC_PATTERNS.items():
        if tactic == ConversationTactic.NEW_CONDITION:
            context = " ".join(required_items)
            if any(word in context for word in ("수습", "공제", "벌금", "교육비", "위약금")):
                continue
        if pattern.search(reply_text):
            found.append(TacticDetection(type=tactic, explanation=explanation))
    if not found and len(reply_text.strip()) < 12:
        found.append(
            TacticDetection(
                type=ConversationTactic.EVASIVE,
                explanation="답변이 짧아 질문한 항목을 확인하기 어렵습니다.",
            )
        )
    return found


def _classification(
    answered: list[str],
    unanswered: list[str],
    tactics: list[TacticDetection],
) -> ReplyClassification:
    if any(tactic.type == ConversationTactic.INTIMIDATING for tactic in tactics):
        return ReplyClassification.UNCLEAR
    if any(tactic.type == ConversationTactic.NEW_CONDITION for tactic in tactics):
        return ReplyClassification.NEW_CONDITION
    if not answered:
        return ReplyClassification.NOT_ANSWERED
    if unanswered:
        return ReplyClassification.PARTLY_ANSWERED
    return ReplyClassification.FULLY_ANSWERED


def _evidence_check(comparison: ComparisonItem) -> EvidenceCheck:
    rights = comparison.legal_reference.rights_check
    if rights.status.value == "standard_mismatch":
        return EvidenceCheck(
            status="record_standard_difference",
            explanation="등록된 기록과 공식 기준 사이에 차이가 있어, 계산·합의 근거를 확인해야 합니다.",
        )
    if rights.status.value == "needs_confirmation":
        return EvidenceCheck(
            status="additional_confirmation_needed",
            explanation="현재 기록만으로는 예외 조건을 확인할 수 없어, 구체적 문서나 계산 근거가 필요합니다.",
        )
    if comparison.status.value == "different":
        return EvidenceCheck(
            status="record_difference",
            explanation="등록된 기록 사이에 조건 차이가 있어, 어느 조건이 적용되는지 확인해야 합니다.",
        )
    return EvidenceCheck(
        status="insufficient_information",
        explanation="현재 자료와 답변만으로는 사실관계를 더 확인해야 합니다.",
    )


def _follow_up_korean(
    unanswered_items: list[str],
    tone: ConversationTone,
    safety_mode: bool,
) -> str:
    targets = ", ".join(unanswered_items[:3]) or "확인할 근거"
    if safety_mode:
        return f"말씀하신 내용을 확인하고 있습니다. {targets}를 문자나 서면으로 알려주세요."
    if tone == ConversationTone.FIRM:
        return (
            f"질문한 내용 중 {targets}는 아직 확인되지 않았습니다. 관련 근거를 서면으로 알려주세요."
        )
    if tone == ConversationTone.POLITE:
        return f"답변해 주신 내용은 확인했습니다. {targets}도 확인해 주실 수 있을까요?"
    return f"질문한 내용 중 {targets}는 아직 확인되지 않았습니다. 관련 근거를 알려주세요."


async def _llm_coverage(
    reply_text: str,
    required_items: list[str],
    comparison: ComparisonItem,
    conversation_history: list[dict] | None = None,
    *,
    client: httpx.AsyncClient | None = None,
) -> tuple[list[str], list[str], list[EmployerClaim], list[ConversationTactic], str | None]:
    settings = get_settings()
    api_key = settings.llm_api_key.strip() or settings.upstage_api_key.strip()
    if not api_key:
        raise ReplyAnalysisLLMError("LLM API 키가 설정되지 않았습니다.")
    payload = {
        "model": UPSTAGE_MODEL,
        "messages": [
            {"role": "system", "content": REPLY_ANALYSIS_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "required_question_items": required_items,
                        "comparison_summary": comparison.summary,
                        "rights_check": comparison.legal_reference.rights_check.model_dump(
                            mode="json"
                        ),
                        "prior_conversation": [
                            {
                                "speaker": (
                                    "worker" if item.get("sender") == "assistant" else "employer"
                                ),
                                "message": _mask_private_text(
                                    str(item.get("original_text", ""))[:500]
                                ),
                            }
                            for item in (conversation_history or [])[-6:]
                        ],
                        "employer_reply": _mask_private_text(reply_text),
                    },
                    ensure_ascii=False,
                ),
            },
        ],
        "temperature": 0.3,
        "max_tokens": 700,
        "response_format": {"type": "json_object"},
        "stream": False,
    }
    owns_client = client is None
    request_client = client or httpx.AsyncClient(timeout=20.0)
    try:
        response = await request_client.post(
            UPSTAGE_CHAT_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
        )
        if response.status_code != 200:
            raise ReplyAnalysisLLMError("답변 분석 API를 호출하지 못했습니다.")
        parsed = json.loads(response.json()["choices"][0]["message"]["content"])
        allowed = set(required_items)
        answered = [item for item in parsed.get("answered_items", []) if item in allowed]
        unanswered = [item for item in parsed.get("unanswered_items", []) if item in allowed]
        unanswered = list(
            dict.fromkeys(unanswered + [item for item in required_items if item not in answered])
        )
        claims = [
            EmployerClaim(text=str(claim.get("text", ""))[:240], status="claimed")
            for claim in parsed.get("claims", [])
            if str(claim.get("text", "")).strip()
        ][:5]
        tactics = [
            ConversationTactic(value)
            for value in parsed.get("tactics", [])
            if value in ConversationTactic._value2member_map_
        ]
        suggested_follow_up = str(parsed.get("suggested_follow_up", "")).strip()[:240]
        if any(word in suggested_follow_up for word in ("불법", "거짓말", "신고하", "고소하")):
            suggested_follow_up = ""
        return (
            list(dict.fromkeys(answered)),
            unanswered,
            claims,
            tactics,
            suggested_follow_up or None,
        )
    except (
        httpx.HTTPError,
        KeyError,
        IndexError,
        TypeError,
        ValueError,
        json.JSONDecodeError,
    ) as exc:
        raise ReplyAnalysisLLMError("답변 분석 결과를 읽지 못했습니다.") from exc
    finally:
        if owns_client:
            await request_client.aclose()


async def _llm_contextual_follow_up(
    reply_text: str,
    unanswered_items: list[str],
    tone: ConversationTone,
    conversation_history: list[dict] | None,
    comparison: ComparisonItem,
) -> str:
    settings = get_settings()
    api_key = settings.llm_api_key.strip() or settings.upstage_api_key.strip()
    if not api_key:
        raise ReplyAnalysisLLMError("LLM API key is not configured")
    recent = [
        {
            "speaker": "worker" if item.get("sender") == "assistant" else "employer",
            "message": _mask_private_text(str(item.get("original_text", ""))[:500]),
        }
        for item in (conversation_history or [])[-6:]
    ]
    refusal_hint = (
        "The employer explicitly refused. Explain why the information is still needed and keep "
        "the conversation moving, but do not repeat or paraphrase the refusal. Do not say "
        "'알겠습니다' or accept ending the discussion."
        if any(marker in reply_text for marker in ("싫", "안 해", "못 해", "말하기 싫"))
        else "Respond specifically to the employer's latest wording."
    )
    payload = {
        "model": UPSTAGE_MODEL,
        "messages": [
            {"role": "system", "content": FOLLOW_UP_WRITER_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "recent_conversation": recent,
                        "employer_latest_reply": _mask_private_text(reply_text),
                        "interaction_requirement": refusal_hint,
                        "current_issue": _mask_private_text(comparison.summary),
                        "still_missing_information": unanswered_items[:3],
                        "requested_tone": tone.value,
                    },
                    ensure_ascii=False,
                ),
            },
        ],
        "temperature": 0.55,
        "max_tokens": 300,
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                UPSTAGE_CHAT_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
        if response.status_code != 200:
            raise ReplyAnalysisLLMError("Follow-up generation failed")
        text = response.json()["choices"][0]["message"]["content"].strip().strip('"')[:240]
        if not text or any(word in text for word in ("불법", "거짓말", "신고하", "고소하")):
            raise ReplyAnalysisLLMError("Unsafe or empty follow-up")
        return text
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
        raise ReplyAnalysisLLMError("Could not generate contextual follow-up") from exc


async def analyze_employer_reply(
    comparison: ComparisonItem,
    reply_text: str,
    original_language: str,
    tone: ConversationTone,
    required_items_override: list[str] | None = None,
    conversation_history: list[dict] | None = None,
) -> ReplyAnalysisData:
    required_items = required_items_override or _required_items(comparison)
    detected_tactics = _tactics(reply_text, required_items)
    llm_follow_up: str | None = None
    llm_available = False
    try:
        answered, unanswered, claims, llm_tactics, llm_follow_up = await _llm_coverage(
            reply_text,
            required_items,
            comparison,
            conversation_history,
        )
        llm_available = True
        for tactic in llm_tactics:
            if tactic not in {item.type for item in detected_tactics}:
                detected_tactics.append(
                    TacticDetection(
                        type=tactic, explanation="답변 내용을 더 확인해야 하는 표현입니다."
                    )
                )
    except ReplyAnalysisLLMError:
        answered, unanswered = _rule_based_coverage(reply_text, required_items)
        claims = _extract_claims(reply_text)

    safety_mode = any(item.type == ConversationTactic.INTIMIDATING for item in detected_tactics)
    classification = _classification(answered, unanswered, detected_tactics)
    if unanswered and not safety_mode and llm_available:
        try:
            follow_up_korean = await _llm_contextual_follow_up(
                reply_text, unanswered, tone, conversation_history, comparison
            )
        except ReplyAnalysisLLMError:
            follow_up_korean = llm_follow_up or _follow_up_korean(unanswered, tone, safety_mode)
    else:
        follow_up_korean = _follow_up_korean(unanswered, tone, safety_mode)
    try:
        translated_reply = await translate_confirmation_text(reply_text, original_language)
        translated_follow_up = await translate_confirmation_text(
            follow_up_korean, original_language
        )
    except TranslationError:
        translated_reply = reply_text
        translated_follow_up = follow_up_korean
    return ReplyAnalysisData(
        reply_id=f"reply_{uuid4().hex}",
        classification=classification,
        claims=claims,
        answered_items=answered,
        unanswered_items=unanswered,
        tactics=detected_tactics,
        evidence_check=_evidence_check(comparison),
        safety_mode=safety_mode,
        safety_note=(
            "위축될 수 있는 표현이 있어 원문과 시간을 보관하고, 짧고 중립적인 문장으로 답하세요."
            if safety_mode
            else None
        ),
        translated_reply=translated_reply,
        follow_up_korean=follow_up_korean,
        translated_follow_up=translated_follow_up,
    )
