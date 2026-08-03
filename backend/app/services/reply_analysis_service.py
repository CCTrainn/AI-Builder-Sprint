"""고용주 답변을 답변/부분답변/미답변으로 구조화한다.

담당: ROLE-BE-CONVERSATION
"""

import json
import re
from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.prompts.conversation import (
    FOLLOW_UP_WRITER_SYSTEM_PROMPT,
    REFUSAL_REPLY_SYSTEM_PROMPT,
    REPLY_ANALYSIS_SYSTEM_PROMPT,
    SAFETY_REPLY_SYSTEM_PROMPT,
)
from app.schemas.comparisons import ComparisonItem
from app.schemas.conversations import (
    CaseStatus,
    ConversationTactic,
    ConversationTone,
    EmployerCommitment,
    EmployerClaim,
    EvidenceCheck,
    NextAction,
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


# Keep deterministic Korean safety/tactic detection independent from LLM wording.
TACTIC_PATTERNS = {
    ConversationTactic.CUSTOMARY_CLAIM: (
        re.compile(r"원래|다\s*그래|관행|보통.*그래|다른\s*(직원|사람).*(받|했)"),
        "일반적인 관행이라는 설명만으로는 개별 계산·합의 근거가 확인되지 않습니다.",
    ),
    ConversationTactic.UNSUPPORTED_LEGAL_CLAIM: (
        re.compile(r"법적(으로)?.*(문제\s*없|괜찮|가능)|불법.*아니|법에.*돼|무조건.*법"),
        "법적 결론을 주장했지만 답변 안에서 확인 가능한 공식 근거가 제시되지 않았습니다.",
    ),
    ConversationTactic.BLAME_SHIFTING: (
        re.compile(r"네가.*(확인|잘못|책임)|너.*(잘못|탓)|왜\s*나한테\s*따져|알아서.*했어야"),
        "계산·합의 근거 대신 근로자에게 책임을 돌리는 표현이 있습니다.",
    ),
    ConversationTactic.DELAYING: (
        re.compile(r"나중에|다음\s*달|기다려|추후|언젠가|정확한\s*날짜.*몰라|확인해\s*볼게"),
        "답변 시점을 미루고 있어 구체적인 회신 날짜를 확인할 필요가 있습니다.",
    ),
    ConversationTactic.NEW_CONDITION: (
        re.compile(r"수습|공제|벌금|교육비|유니폼|위약금|보증금"),
        "기존 기록에 없을 수 있는 조건이 새로 언급되어 서면 근거 확인이 필요합니다.",
    ),
    ConversationTactic.INTIMIDATING: (
        re.compile(
            r"해고|자르|비자.*(취소|문제)|신고해|신고하고\s*싶으면|가만.*안|죽여|"
            r"찾아가|불이익|보복|근무.{0,12}빼|스케줄.{0,12}(빼|없)|일\s*못\s*할|"
            r"계약.{0,12}(끝|해지)|그만두게|같이\s*일하기\s*(어렵|힘들)|계속\s*일하기\s*(어렵|힘들)"
        ),
        "질문을 중단시키거나 위축시킬 수 있는 표현이 있어 안전을 먼저 확인해야 합니다.",
    ),
    ConversationTactic.EXPLICIT_REFUSAL: (
        re.compile(r"(안|못)\s*(줘|준다|주겠|해|한다|하겠|설명|바꿔|바꾸)|줄\s*수\s*없|할\s*생각\s*없|끝까지.*거부"),
        "지급·수정·설명을 명시적으로 거부해 같은 질문 반복보다 기록 보관과 공식 지원 검토가 필요합니다.",
    ),
}


class ReplyAnalysisLLMError(RuntimeError):
    """LLM이 답변 분석 JSON을 반환하지 못한 경우."""


def _parse_llm_json(content: str) -> dict:
    value = content.strip()
    if value.startswith("```"):
        value = re.sub(r"^```(?:json)?\s*", "", value, flags=re.IGNORECASE)
        value = re.sub(r"\s*```$", "", value)
    start = value.find("{")
    end = value.rfind("}")
    if start < 0 or end < start:
        raise json.JSONDecodeError("JSON object not found", value, 0)
    parsed = json.loads(value[start : end + 1])
    if not isinstance(parsed, dict):
        raise json.JSONDecodeError("JSON object required", value, start)
    return parsed


def _required_items(comparison: ComparisonItem) -> list[str]:
    items = comparison.legal_reference.rights_check.missing_information
    items = items or comparison.confirmation_items
    return list(dict.fromkeys(items)) or ["현재 적용되는 조건", "계산 또는 변경 근거"]


def _extract_claims(reply_text: str) -> list[EmployerClaim]:
    sentences = [
        sentence.strip() for sentence in re.split(r"[.!?\n]+", reply_text) if sentence.strip()
    ]
    return [EmployerClaim(text=sentence[:240], status="claimed") for sentence in sentences[:5]]


def _rule_based_commitments(reply_text: str) -> list[EmployerCommitment]:
    """LLM이 놓친 명시적인 조치 약속과 완료 주장을 보수적으로 복구한다."""
    action_pattern = re.compile(
        r"(?:입금|지급|정산|계산|수정|반영|보내|보냈|전송|쉬게|확인해\s*볼|"
        r"현금.{0,20}(?:주|줬)|근무표.{0,30}(?:바꾸|고치|수정|넣|만들|보냈))"
    )
    intention_pattern = re.compile(
        r"(?:할게|줄게|보낼게|해줄게|하겠|드리겠|처리하겠|확인해\s*볼게|"
        r"했어|했습니다|완료했|입금했|보냈|수정했|반영했|줬어|넣을게)"
    )
    if not (action_pattern.search(reply_text) and intention_pattern.search(reply_text)):
        return []

    completed = bool(re.search(r"입금했|보냈|수정했|반영했|완료했|현금.{0,15}줬", reply_text))
    due_matches = re.findall(
        r"(?:오늘|어제|내일|모레|이번\s*주(?:\s*[월화수목금토일]요일)?|"
        r"다음\s*주(?:\s*[월화수목금토일]요일)?|[월화수목금토일]요일까지|"
        r"\d{1,2}월\s*\d{1,2}일(?:까지|에)?|\d{1,2}일까지)",
        reply_text,
    )
    amount_matches = re.findall(r"(?:전액|절반|나머지|\d[\d,]*\s*원)", reply_text)
    document_match = re.search(r"(?:급여)?명세서|근무표|입금내역|출근기록", reply_text)
    return [
        EmployerCommitment(
            action=" ".join(reply_text.split())[:240],
            due_date=" / ".join(dict.fromkeys(due_matches))[:40] or None,
            amount=" / ".join(dict.fromkeys(amount_matches))[:80] or None,
            document=document_match.group(0) if document_match else None,
            claimed_status="claimed_completed" if completed else "promised",
        )
    ]


def _keyword_tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[가-힣A-Za-z0-9]{2,}", text)
        if token not in {"확인", "기간", "근거", "내용", "조건"}
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


def _guard_coverage(
    reply_text: str,
    required_items: list[str],
    answered: list[str],
) -> tuple[list[str], list[str]]:
    guarded = list(answered)
    has_time = bool(re.search(r"\d{1,4}\s*(년|월|일)|부터|이후|다음\s*달|오늘|어제", reply_text))
    has_reason = bool(
        re.search(r"이유|때문|라서|해서|수습|매출|공제|교육비|합의|착오|누락", reply_text)
    )
    has_current_condition = bool(
        re.search(r"\d[\d,]*\s*원|현재|적용|계약서.*맞|계약대로", reply_text)
    )
    for item in list(guarded):
        if "시점" in item and "이유" in item and not (has_time and has_reason):
            guarded.remove(item)
        elif "현재 적용" in item and not has_current_condition:
            guarded.remove(item)
    unanswered = [item for item in required_items if item not in guarded]
    return guarded, unanswered


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


async def _llm_coverage(
    reply_text: str,
    required_items: list[str],
    comparison: ComparisonItem,
    conversation_history: list[dict] | None = None,
    *,
    client: httpx.AsyncClient | None = None,
) -> tuple[list[str], list[str], list[EmployerClaim], list[ConversationTactic], str | None]:
    # Coverage and commitments must be grounded only in the latest employer reply.
    # Conversation history is reserved for the separate follow-up writer.
    conversation_history = None
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
                        "확인할 항목": required_items,
                        "현재 문제": comparison.summary,
                        "기록 근거 확인": comparison.legal_reference.rights_check.model_dump(
                            mode="json"
                        ),
                        "앞선 대화": [
                            {
                                "화자": (
                                    "근로자" if item.get("sender") == "assistant" else "고용주"
                                ),
                                "메시지": _mask_private_text(
                                    str(item.get("original_text", ""))[:500]
                                ),
                            }
                            for item in (conversation_history or [])[-6:]
                        ],
                        "고용주의 최신 답변": _mask_private_text(reply_text),
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
        parsed = _parse_llm_json(response.json()["choices"][0]["message"]["content"])
        allowed = set(required_items)
        answered = [item for item in parsed.get("answered_items", []) if item in allowed]
        if not answered:
            rule_answered, _ = _rule_based_coverage(reply_text, required_items)
            answered = rule_answered
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
        progress = {
            "commitments": parsed.get("commitments", []),
            "next_action_hint": str(parsed.get("next_action_hint", ""))[:300],
        }
        follow_up = str(parsed.get("follow_up_korean", "")).strip().strip('"')[:240]
        return (
            list(dict.fromkeys(answered)),
            unanswered,
            claims,
            tactics,
            follow_up or None,
            progress,
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


async def _llm_contextual_follow_up_raw(
    reply_text: str,
    unanswered_items: list[str],
    tone: ConversationTone,
    conversation_history: list[dict] | None,
    comparison: ComparisonItem,
    safety_mode: bool = False,
    explicit_refusal: bool = False,
) -> str:
    settings = get_settings()
    api_key = settings.llm_api_key.strip() or settings.upstage_api_key.strip()
    if not api_key:
        raise ReplyAnalysisLLMError("LLM API 키가 설정되지 않았습니다.")
    recent = [
        {
            "speaker": "worker" if item.get("sender") == "assistant" else "employer",
            "message": _mask_private_text(str(item.get("original_text", ""))[:500]),
        }
        for item in (conversation_history or [])[-6:]
    ]
    payload = {
        "model": UPSTAGE_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    SAFETY_REPLY_SYSTEM_PROMPT
                    if safety_mode
                    else REFUSAL_REPLY_SYSTEM_PROMPT
                    if explicit_refusal
                    else FOLLOW_UP_WRITER_SYSTEM_PROMPT
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "앞선 대화": recent,
                        "지금까지의 메시지 수": len(recent),
                        "이번 답장 목표": "가능하면 이번 한 번의 답장으로 남은 사실과 조치 일정을 함께 확정",
                        "고용주의 최신 답변": _mask_private_text(reply_text),
                        "현재 문제": _mask_private_text(comparison.summary),
                        "아직 확인되지 않은 정보": unanswered_items[:3],
                        "말투": tone.value,
                        "안전 우선 모드": safety_mode,
                        "명시적 거부 감지": explicit_refusal,
                        "강한 권리 주장 모드": comparison.legal_reference.rights_check.status.value == "standard_mismatch",
                        "공식 기준": {
                            "제목": comparison.legal_reference.title,
                            "조문 내용": _mask_private_text(comparison.legal_reference.article or ""),
                            "공식 출처": comparison.legal_reference.source_url,
                            "기록과 기준 비교": comparison.legal_reference.rights_check.explanation,
                        },
                    },
                    ensure_ascii=False,
                ),
            },
        ],
        # 데모와 실사용에서 해결 단계가 안정적으로 유지되도록 표현 편차를 줄인다.
        "temperature": 0.45,
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
        text = response.json()["choices"][0]["message"]["content"].strip().strip('"')
        if not text or any(word in text for word in ("불법", "거짓말", "신고하", "고소하")):
            raise ReplyAnalysisLLMError("Unsafe or empty follow-up")
        return text
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
        raise ReplyAnalysisLLMError("Could not generate contextual follow-up") from exc


def _resolution_verification_guide(condition: str) -> str:
    guides = {
        "hourly_wage": "수정된 급여명세서와 실제 입금액에서 시급 및 차액이 반영됐는지 확인하세요.",
        "gross_pay": "급여명세서의 총지급액과 실제 입금내역이 일치하는지 확인하세요.",
        "net_pay": "급여명세서의 실수령액과 실제 입금액이 일치하는지 확인하세요.",
        "weekly_holiday_pay": "재계산된 명세서의 주휴수당 금액과 실제 입금액을 확인하세요.",
        "pay_date": "약속한 날짜의 실제 입금내역과 금액을 확인하세요.",
        "working_hours": "새 근무표와 실제 출퇴근 기록에서 변경된 시간이 계속 적용되는지 확인하세요.",
        "weekly_working_hours": "새 근무표와 주간 출퇴근 기록의 총 근로시간을 확인하세요.",
        "total_working_hours": "해당 기간 출퇴근 기록과 명세서의 총 근로시간을 함께 확인하세요.",
        "overtime_hours": "연장·야간·휴일근로 기록과 해당 수당이 명세서에 반영됐는지 확인하세요.",
        "break_time": "근무표뿐 아니라 실제 근무 중 약속한 휴게를 자유롭게 사용했는지 확인하세요.",
        "probation": "수정된 계약서와 급여명세서에서 수습 조건 및 적용 기간을 확인하세요.",
    }
    return guides.get(
        condition,
        "고용주가 약속한 변경이 최신 문서와 실제 근무·지급 기록에 모두 반영됐는지 확인하세요.",
    )


async def _llm_contextual_follow_up(
    reply_text: str,
    unanswered_items: list[str],
    tone: ConversationTone,
    conversation_history: list[dict] | None,
    comparison: ComparisonItem,
    safety_mode: bool = False,
    explicit_refusal: bool = False,
) -> str:
    rights_assertion_mode = (
        comparison.legal_reference.rights_check.status.value == "standard_mismatch"
    )
    source_context = " ".join(
        [reply_text]
        + [str(item.get("original_text", "")) for item in (conversation_history or [])]
    )
    normalized_source = re.sub(r"\s+", "", source_context)
    for _ in range(2):
        try:
            text = await _llm_contextual_follow_up_raw(
                reply_text,
                unanswered_items,
                tone,
                conversation_history,
                comparison,
                safety_mode,
                explicit_refusal,
            )
        except ReplyAnalysisLLMError:
            continue
        invalid = not text or any(
            word in text for word in (
                "불법", "거짓말", "신고할", "고소할", "지침을 분석", "**",
                "안녕하세요", "감사", "좋은 하루",
                "<think", "</think>",
            )
        )
        invalid = invalid or len(text) > 180
        invalid = invalid or bool(re.match(r"\s*사장님(?:[,.!?\s]|$)", text))
        invalid = invalid or text.count("\n") > 1
        invalid = invalid or bool(
            re.search(r"(?:^|\n)\s*(?:사장님[,.]?\s*)?(?:안녕|감사)", text)
        )
        if comparison.condition == "working_hours" and comparison.contracted:
            contracted_text = str(comparison.contracted.value)
            actual_text = str(comparison.actual.value) if comparison.actual else ""
            normalized_text = text.replace("~", "-").replace("–", "-").replace("‑", "-")
            invalid = invalid or bool(
                contracted_text in text
                and re.search(rf"{re.escape(contracted_text)}\s*(?:로|으로)?의?\s*변경", text)
            )
            invalid = invalid or not any(
                value.replace("~", "-").replace("–", "-").replace("‑", "-") in normalized_text
                for value in (contracted_text, actual_text)
                if value
            )
        if comparison.condition == "break_time":
            invalid = invalid or any(
                word in text for word in ("급여", "입금", "지급 내역", "명세서", "정산")
            )
        generated_timings = re.findall(
            r"오늘|금일|지난\s*주|이번\s*주(?:\s*[월화수목금토일]요일)?|다음\s*주|내일|모레|"
            r"\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일|"
            r"\d+\s*시간\s*내|\d+\s*(?:일|주|개월)\s*(?:안|내|이내|까지)",
            text,
        )
        invalid = invalid or any(
            re.sub(r"\s+", "", timing) not in normalized_source
            for timing in generated_timings
        )
        invalid = invalid or bool(re.match(r"\s*(?:A|답변)\s*[:：]", text))
        invalid = invalid or (
            "확인했습니다" in text and "확인했습니다" not in source_context
        )
        invalid = invalid or bool(
            re.search(r"(?:입금|반영|지급)\s*(?:내역\s*)?확인(?:은)?\s*(?:했|됐)", text)
        )
        invalid = invalid or any(
            phrase in text for phrase in ("안내해 드리겠습니다", "처리해 드리겠습니다", "정정해 드리겠습니다")
        )
        if safety_mode:
            invalid = invalid or not any(
                word in text for word in ("서면", "문자", "기록", "보관")
            )
        elif explicit_refusal:
            invalid = invalid or any(word in text for word in ("법", "위반", "최저임금")) or "?" in text or "확인해 주" in text or not any(
                word in text for word in ("기록", "보관", "상담")
            )
        elif not rights_assertion_mode:
            invalid = invalid or any(
                word in text for word in ("법", "조항", "최저임금", "위반")
            )
        if not invalid:
            return text

    if safety_mode:
        condition_request = {
            "break_time": "기록된 근무시간에 맞는 휴게시간과 적용 계획",
            "pay_date": "계약상 지급일에 따른 미지급 급여의 지급 일정",
            "weekly_holiday_pay": "주휴수당의 계산 내역과 지급 계획",
            "working_hours": "계약과 다른 근무시간 및 추가 근무의 처리 계획",
        }.get(comparison.condition, "현재 기록과 다른 조건의 시정 계획")
        return f"{condition_request}을 서면으로 알려 주세요. 이후 연락은 서면으로 진행하고 현재 대화 내용은 기록으로 보관하겠습니다."
    if explicit_refusal:
        refusal_subject = {
            "break_time": "휴게시간 시정",
            "pay_date": "급여 지급 일정",
            "weekly_holiday_pay": "주휴수당 계산과 지급",
            "working_hours": "계약과 다른 근무시간의 변경 및 추가 근무 처리",
        }.get(comparison.condition, "현재 기록과 다른 조건의 시정")
        return f"{refusal_subject}을 거부하신 답변은 기록으로 보관하겠습니다. 관련 자료를 정리해 공식 상담 절차를 확인하겠습니다."
    if any("정확한 이행 날짜" in item for item in unanswered_items):
        return "차액을 지급할 정확한 날짜와 금액, 지급 방식, 수정된 급여명세서를 언제 받을 수 있는지 구체적으로 알려주세요."
    if comparison.condition == "working_hours":
        contracted = comparison.contracted.value if comparison.contracted else "계약 시간"
        actual = comparison.actual.value if comparison.actual else "실제 근무시간"
        return f"계약서의 {contracted}와 실제 {actual} 기록이 다릅니다. 실제 근무가 시작된 시점과 변경 합의 여부, 추가 근무 처리 계획을 서면으로 알려주세요."
    if comparison.condition == "break_time":
        promised = comparison.promised.value if comparison.promised else "약속 기록"
        contracted = comparison.contracted.value if comparison.contracted else "계약 기록"
        return f"약속된 휴게시간 {promised}와 계약서의 {contracted}가 다릅니다. 현재 실제 휴게시간과 적용 시작일, 근무 중 자유롭게 사용할 수 있는지 서면으로 알려주세요."
    if comparison.condition == "pay_date":
        contracted = comparison.contracted.value if comparison.contracted else "계약 지급일"
        actual = comparison.actual.value if comparison.actual else "실제 지급일"
        return f"계약상 급여일 {contracted}과 실제 지급 기록 {actual}이 다릅니다. 앞으로 적용할 지급일과 지연된 급여의 처리 계획을 서면으로 알려주세요."
    if comparison.condition == "weekly_holiday_pay":
        return "주휴수당의 적용 기준과 실제 산정 내역, 미반영 금액의 처리 계획을 서면으로 알려주세요."
    return "현재 기록과 다른 조건의 적용 기준, 변경 시점과 처리 계획을 서면으로 알려주세요."


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
        coverage = await _llm_coverage(
            reply_text,
            required_items,
            comparison,
            conversation_history,
        )
        answered, unanswered, claims, llm_tactics, llm_follow_up = coverage[:5]
        progress = coverage[5] if len(coverage) > 5 else {}
        llm_available = True
        for tactic in llm_tactics:
            if tactic == ConversationTactic.INTIMIDATING and not any(
                item.type == ConversationTactic.INTIMIDATING for item in detected_tactics
            ):
                continue
            if tactic not in {item.type for item in detected_tactics}:
                detected_tactics.append(
                    TacticDetection(
                        type=tactic, explanation="답변 내용을 더 확인해야 하는 표현입니다."
                    )
                )
    except ReplyAnalysisLLMError:
        answered, unanswered = _rule_based_coverage(reply_text, required_items)
        claims = _extract_claims(reply_text)
        llm_tactics = []
        progress = {}

    safety_mode = any(item.type == ConversationTactic.INTIMIDATING for item in detected_tactics)
    explicit_refusal = any(
        item.type == ConversationTactic.EXPLICIT_REFUSAL for item in detected_tactics
    )
    rights_assertion_mode = (
        comparison.legal_reference.rights_check.status.value == "standard_mismatch"
    )
    answered, unanswered = _guard_coverage(reply_text, required_items, answered)
    classification = _classification(answered, unanswered, detected_tactics)
    commitments = []
    for item in progress.get("commitments", []):
        if not isinstance(item, dict) or not str(item.get("action", "")).strip():
            continue
        commitments.append(
            EmployerCommitment(
                action=str(item["action"])[:240],
                due_date=(
                    None
                    if str(item.get("due_date") or "").strip().lower() in {"", "미상", "없음", "null"}
                    else str(item.get("due_date"))[:40]
                ),
                amount=(
                    None
                    if str(item.get("amount") or "").strip().lower() in {"", "미상", "없음", "null"}
                    else str(item.get("amount"))[:80]
                ),
                document=(
                    None
                    if str(item.get("document") or "").strip().lower() in {"", "미상", "없음", "null"}
                    else str(item.get("document"))[:120]
                ),
                claimed_status=(
                    "claimed_completed"
                    if item.get("claimed_status") == "claimed_completed"
                    else "promised"
                ),
            )
        )
    rule_commitments = _rule_based_commitments(reply_text)
    if rule_commitments and not commitments:
        commitments = rule_commitments
    elif rule_commitments and commitments:
        rule_item = rule_commitments[0]
        for commitment in commitments:
            if (
                rule_item.due_date
                and re.search(r"오늘|어제|내일|모레|이번\s*주|다음\s*주", rule_item.due_date)
                and (
                not commitment.due_date or commitment.due_date not in reply_text
                )
            ):
                commitment.due_date = rule_item.due_date
            commitment.amount = commitment.amount or rule_item.amount
            commitment.document = commitment.document or rule_item.document
            if rule_item.claimed_status == "claimed_completed":
                commitment.claimed_status = "claimed_completed"
    remedy_mentioned = bool(_rule_based_commitments(reply_text)) or bool(
        re.search(r"입금|지급|정산|수정|전송|보냈|차액.*(주|반영)|급여.*반영", reply_text)
    )
    if not remedy_mentioned:
        commitments = []
    if safety_mode:
        case_status = CaseStatus.SAFETY_ATTENTION
    elif explicit_refusal:
        case_status = CaseStatus.ESCALATION_RECOMMENDED
    elif any(item.claimed_status == "claimed_completed" for item in commitments):
        case_status = CaseStatus.USER_CONFIRMATION_NEEDED
    elif commitments:
        case_status = CaseStatus.WAITING_FOR_ACTION
    elif unanswered:
        case_status = CaseStatus.NEEDS_FOLLOW_UP
    else:
        case_status = CaseStatus.WAITING_FOR_EVIDENCE

    if case_status == CaseStatus.SAFETY_ATTENTION:
        next_action = NextAction(
            type="preserve_evidence",
            title="원문을 보관하고 서면으로 권리 확인을 계속하세요",
            description="협박 표현과 시간을 보관하고, 대면 논쟁은 피하면서 시정 내용과 답변 날짜를 서면으로 요구하세요.",
            target_url="../records/records.html",
        )
    elif case_status == CaseStatus.ESCALATION_RECOMMENDED:
        next_action = NextAction(
            type="official_support",
            title="같은 질문을 반복하지 말고 기록을 보관하세요",
            description="지급·수정 거부가 명확합니다. 원문과 근로자료를 보관하고 고용노동부 상담 등 공식 지원 절차를 확인하세요.",
            target_url="https://labor.moel.go.kr/minwonSysInfo/wagesolway.do",
        )
    elif case_status == CaseStatus.WAITING_FOR_ACTION:
        due_date = next((item.due_date for item in commitments if item.due_date), None)
        next_action = NextAction(
            type="wait_and_verify",
            title="약속한 조치가 실제로 반영되는지 확인하세요",
            description=progress.get("next_action_hint") or "약속 시점 이후 급여명세서·입금내역·근무표를 추가해 기존 기록과 비교하세요.",
            due_date=due_date,
            target_url="../records/records.html",
        )
    elif case_status == CaseStatus.USER_CONFIRMATION_NEEDED:
        next_action = NextAction(
            type="confirm_resolution",
            title="실제로 해결됐는지 확인해 주세요",
            description=_resolution_verification_guide(comparison.condition),
            target_url="../records/records.html",
        )
    elif case_status == CaseStatus.WAITING_FOR_EVIDENCE:
        next_action = NextAction(
            type="add_evidence",
            title="답변이 실제 기록에 반영됐는지 확인하세요",
            description=progress.get("next_action_hint") or "급여명세서·입금내역·근무표 등 새 자료를 추가해 확인하세요.",
            target_url="../records/records.html",
        )
    else:
        next_action = NextAction(
            type="send_follow_up",
            title="아직 확인되지 않은 내용을 이어서 물어보세요",
            description=progress.get("next_action_hint") or "추천 답장을 확인하고 대화를 계속하세요.",
        )
    commitment_targets = []
    for commitment in commitments:
        if commitment.claimed_status == "claimed_completed":
            commitment_targets.append(
                "완료했다는 말만으로 끝내지 말고 실제 입금내역·명세서·근무표에서 반영 여부를 확인"
            )
        else:
            missing_parts = []
            if not commitment.due_date or re.search(
                r"오늘|어제|내일|모레|이번\s*주|다음\s*주|이번\s*달|다음\s*달",
                commitment.due_date,
            ):
                missing_parts.append("정확한 이행 날짜")
            if not commitment.amount and comparison.condition in {"pay_date", "weekly_holiday_pay"}:
                missing_parts.append("지급 금액")
            if not commitment.document:
                missing_parts.append("확인 가능한 문서나 기록")
            commitment_targets.append(
                "고용주의 조치 약속을 다시 처음부터 묻지 말고 "
                + ("·".join(missing_parts) + "을 확정" if missing_parts else "약속 후 실제 반영 여부를 확인")
            )
    # 고용주가 시정 조치를 약속한 뒤에는 과거 이유를 되묻지 않는다. 빠진 약속
    # 정보나 실제 이행 확인만 전달해 대화가 해결 단계에서 뒤로 돌아가지 않게 한다.
    target_candidates = commitment_targets if commitments else unanswered
    follow_up_targets = list(dict.fromkeys(target_candidates)) or [
        "답변에서 말한 조치가 실제 급여·근무 기록에 반영되는지 확인할 기준이나 남길 기록",
        "이미 답변받은 날짜와 이유는 다시 묻지 말고 실제 이행 여부를 확인할 다음 단계",
    ]
    try:
        follow_up_korean = await _llm_contextual_follow_up(
            reply_text,
            follow_up_targets,
            tone,
            conversation_history,
            comparison,
            safety_mode,
            explicit_refusal,
        )
    except ReplyAnalysisLLMError:
        raise
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
        case_status=case_status,
        commitments=commitments,
        next_action=next_action,
        rights_assertion_mode=rights_assertion_mode,
        official_basis_title=(comparison.legal_reference.title if rights_assertion_mode else None),
        official_basis_url=(comparison.legal_reference.source_url if rights_assertion_mode else None),
    )
