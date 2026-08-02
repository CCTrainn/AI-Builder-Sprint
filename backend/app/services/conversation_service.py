"""기록 차이를 고용주 확인 문장으로 변환한다.

담당: ROLE-BE-CONVERSATION
"""

from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.prompts.conversation import TRANSLATION_SYSTEM_PROMPT
from app.schemas.community import ExperienceMatchRequest
from app.schemas.comparisons import ComparisonItem
from app.schemas.conversations import ConfirmationMessageData, ConversationTone
from app.services.similarity_service import find_similar_experiences

UPSTAGE_CHAT_URL = "https://api.upstage.ai/v1/chat/completions"
UPSTAGE_MODEL = "solar-pro3"

CONDITION_LABELS = {
    "hourly_wage": "시급",
    "working_hours": "근무시간",
    "weekly_working_hours": "주 근로시간",
    "break_time": "휴게시간",
    "pay_date": "급여 지급일",
    "weekly_holiday_pay": "주휴수당",
    "overtime_hours": "연장·야간·휴일근로 시간",
    "gross_pay": "지급액",
    "net_pay": "실수령액",
    "probation": "수습 조건",
}


class TranslationError(RuntimeError):
    """번역 제공자가 문장을 반환하지 못한 경우."""


def _format_value(value: object, unit: str | None) -> str:
    if unit == "KRW" and isinstance(value, (int, float)):
        return f"{value:,.0f}원"
    if unit in {"hour", "hours", "hours_per_week", "hours_per_month"}:
        return f"{value}시간"
    return str(value)


def _comparison_basis(comparison: ComparisonItem) -> list[str]:
    source_labels = (
        ("약속", comparison.promised),
        ("계약", comparison.contracted),
        ("실제 기록", comparison.actual),
    )
    basis = [
        f"{label} {CONDITION_LABELS.get(comparison.condition, comparison.condition)} "
        f"{_format_value(value.value, value.unit)}"
        for label, value in source_labels
        if value is not None and value.value is not None
    ]
    rights_check = comparison.legal_reference.rights_check
    basis.extend(rights_check.basis)
    problem_type = {
        "hourly_wage": "hourly_wage_difference",
        "gross_pay": "delayed_payment",
        "net_pay": "delayed_payment",
        "working_hours": "working_hours_changed",
        "weekly_working_hours": "working_hours_changed",
    }.get(comparison.condition)
    if problem_type:
        matched = find_similar_experiences(
            ExperienceMatchRequest(problem_type=problem_type, limit=4)
        )
        if matched.matches:
            basis.append(
                f"비슷한 공동 경험 {len(matched.matches)}건 참고: "
                f"{matched.matches[0].experience.helpful_action}"
            )
    return list(dict.fromkeys(basis))


def _question_items(comparison: ComparisonItem) -> list[str]:
    rights_items = comparison.legal_reference.rights_check.missing_information
    items = rights_items or comparison.confirmation_items
    if items:
        return items[:3]
    return ["현재 적용되는 조건", "계산 또는 변경 근거"]


def _korean_message(comparison: ComparisonItem, tone: ConversationTone) -> str:
    label = CONDITION_LABELS.get(comparison.condition, "근로조건")
    basis = _comparison_basis(comparison)
    facts = ", ".join(basis[:2]) or comparison.summary
    question = ", ".join(_question_items(comparison))

    if tone == ConversationTone.CLEAR:
        return f"{label} 관련 기록을 확인하고 있습니다. {facts}로 기록되어 있습니다. {question}을 알려주세요."
    if tone == ConversationTone.FIRM:
        return f"{label} 관련 기록에 차이 또는 확인할 내용이 있습니다. {facts}입니다. {question}을 서면으로 확인해 주세요."
    return f"{label} 관련하여 기록을 확인하고 있습니다. {facts}인데, {question}을 확인해 주실 수 있을까요?"


async def translate_confirmation_text(
    korean_text: str,
    user_language: str,
    *,
    client: httpx.AsyncClient | None = None,
) -> str:
    """Upstage Solar에는 번역만 맡기고 원래 확인 문장을 변경하지 않는다."""

    if user_language.lower().startswith("ko"):
        return korean_text

    settings = get_settings()
    api_key = settings.llm_api_key.strip() or settings.upstage_api_key.strip()
    if not api_key:
        return korean_text

    payload = {
        "model": UPSTAGE_MODEL,
        "messages": [
            {"role": "system", "content": TRANSLATION_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Target language: {user_language}\nKorean message:\n{korean_text}",
            },
        ],
        "temperature": 0.1,
        "max_tokens": 500,
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
            raise TranslationError(f"번역 API 응답 오류: {response.status_code}")
        translated_text = response.json()["choices"][0]["message"]["content"].strip()
        if not translated_text:
            raise TranslationError("번역 API가 빈 문장을 반환했습니다.")
        return translated_text
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
        raise TranslationError("번역 API를 호출하지 못했습니다.") from exc
    finally:
        if owns_client:
            await request_client.aclose()


async def generate_confirmation_message(
    comparison: ComparisonItem,
    tone: ConversationTone,
    user_language: str,
) -> ConfirmationMessageData:
    korean_text = _korean_message(comparison, tone)
    try:
        translated_text = await translate_confirmation_text(korean_text, user_language)
    except TranslationError:
        # 질문 문장 자체는 사용할 수 있도록 보존한다. 프론트는 한국어 문장을 항상 복사할 수 있다.
        translated_text = korean_text
    return ConfirmationMessageData(
        message_id=f"msg_{uuid4().hex}",
        korean_text=korean_text,
        translated_text=translated_text,
        basis=_comparison_basis(comparison),
    )
