"""기록 차이를 근거로 실제 전송할 대화 초안을 LLM으로 생성한다."""

import json
import re
from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.prompts.conversation import (
    INITIAL_MESSAGE_SYSTEM_PROMPT,
    OPENING_MESSAGE_SYSTEM_PROMPT,
    TRANSLATION_SYSTEM_PROMPT,
)
from app.schemas.comparisons import ComparisonItem
from app.schemas.conversations import ConfirmationMessageData, ConversationTone

UPSTAGE_CHAT_URL = "https://api.upstage.ai/v1/chat/completions"
UPSTAGE_MODEL = "solar-pro3"

SUPPORTED_TRANSLATION_LANGUAGES = {
    "vi": "베트남어(Tiếng Việt)",
    "zh-cn": "중국어 간체(简体中文)",
    "zh": "중국어 간체(简体中文)",
    "th": "태국어(ภาษาไทย)",
    "id": "인도네시아어(Bahasa Indonesia)",
    "en": "영어(English)",
}

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
    """번역 LLM이 문장을 반환하지 못한 경우."""


class MessageGenerationError(RuntimeError):
    """대화 생성 LLM이 문장을 반환하지 못한 경우."""


def _format_value(value: object, unit: str | None) -> str:
    if unit == "KRW" and isinstance(value, (int, float)):
        return f"{value:,.0f}원"
    if unit in {"hour", "hours", "hours_per_week", "hours_per_month"}:
        return f"{value}시간"
    if unit == "day" and isinstance(value, (int, float)):
        return f"매월 {value:g}일"
    return str(value)


def _comparison_basis(comparison: ComparisonItem) -> list[str]:
    source_labels = (
        ("약속", comparison.promised),
        ("계약", comparison.contracted),
        ("실제 기록", comparison.actual),
    )
    return [
        f"{label} {CONDITION_LABELS.get(comparison.condition, comparison.condition)} "
        f"{_format_value(item.value, item.unit)}"
        for label, item in source_labels
        if item is not None and item.value is not None
    ]


def _question_items(comparison: ComparisonItem) -> list[str]:
    items = comparison.legal_reference.rights_check.missing_information or comparison.confirmation_items
    return items[:3]


def _invalid_continuation_message(text: str) -> bool:
    return bool(
        len(text) > 240
        or re.search(r"(?:^|\n)\s*사장님[,.]?", text)
        or re.search(r"(?:^|\n)\s*(?:사장님[,.]?\s*)?(?:안녕|감사)", text)
        or any(word in text for word in ("감사합니다", "감사드립니다", "감사하겠습니다", "<think", "</think>"))
        or bool(re.search(r"오늘|어제|지난\s*주", text))
    )


def _fallback_confirmation_message(comparison: ComparisonItem) -> str:
    values = {
        "promised": _format_value(comparison.promised.value, comparison.promised.unit) if comparison.promised else None,
        "contracted": _format_value(comparison.contracted.value, comparison.contracted.unit) if comparison.contracted else None,
        "actual": _format_value(comparison.actual.value, comparison.actual.unit) if comparison.actual else None,
    }
    if comparison.condition == "working_hours":
        return f"계약 근무시간 {values['contracted']}와 실제 {values['actual']} 기록이 다릅니다. 실제 적용 시작일과 변경 합의 여부, 추가 근무 처리 계획을 알려주세요."
    if comparison.condition == "break_time":
        return f"약속된 휴게시간 {values['promised']}와 계약서의 {values['contracted']}가 다릅니다. 현재 실제 휴게시간과 적용 시작일, 근무 중 자유롭게 사용할 수 있는지 알려주세요."
    if comparison.condition == "pay_date":
        return f"계약상 급여일 {values['contracted']}과 실제 지급 기록 {values['actual']}이 다릅니다. 앞으로 적용할 지급일과 지연된 경우의 처리 계획을 알려주세요."
    if comparison.condition == "weekly_holiday_pay":
        return f"계약 기록은 {values['contracted']}인데 실제 주휴수당은 {values['actual']}입니다. 적용한 계산 기준과 산정 내역, 처리 계획을 알려주세요."
    basis = ", ".join(_comparison_basis(comparison))
    return f"{basis} 사이에 차이가 있습니다. 현재 적용 기준과 변경 시점, 처리 계획을 알려주세요."


async def _generate_korean_text(
    system_prompt: str,
    context: dict,
    *,
    temperature: float = 0.8,
) -> str:
    settings = get_settings()
    api_key = settings.llm_api_key.strip() or settings.upstage_api_key.strip()
    if not api_key:
        raise MessageGenerationError("LLM API 키가 설정되지 않았습니다.")
    payload = {
        "model": UPSTAGE_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(context, ensure_ascii=False)},
        ],
        "temperature": temperature,
        "max_tokens": 350,
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
            raise MessageGenerationError(f"대화 생성 API 응답 오류: {response.status_code}")
        text = response.json()["choices"][0]["message"]["content"].strip().strip('"')
        if not text:
            raise MessageGenerationError("LLM이 빈 문장을 반환했습니다.")
        return text[:500]
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
        raise MessageGenerationError("LLM 대화 생성에 실패했습니다.") from exc


async def generate_opening_message(tone: ConversationTone) -> str:
    return await _generate_korean_text(
        OPENING_MESSAGE_SYSTEM_PROMPT,
        {"출력 언어": "한국어", "말투": tone.value, "목적": "근무조건 질문 전 첫 인사와 연결"},
        temperature=0.8,
    )


async def translate_confirmation_text(
    korean_text: str,
    user_language: str,
    *,
    client: httpx.AsyncClient | None = None,
) -> str:
    normalized_language = user_language.strip().lower().replace("_", "-")
    if normalized_language.startswith("ko"):
        return korean_text
    target_language = SUPPORTED_TRANSLATION_LANGUAGES.get(normalized_language)
    if target_language is None:
        raise TranslationError(f"지원하지 않는 번역 언어입니다: {user_language}")
    settings = get_settings()
    api_key = settings.llm_api_key.strip() or settings.upstage_api_key.strip()
    if not api_key:
        return korean_text
    request_client = client or httpx.AsyncClient(timeout=20.0)
    try:
        for attempt in range(2):
            payload = {
                "model": UPSTAGE_MODEL,
                "messages": [
                    {"role": "system", "content": TRANSLATION_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": json.dumps(
                            {
                                "목표 언어": target_language,
                                "목표 언어 코드": normalized_language,
                                "번역할 한국어 원문": korean_text,
                                "재시도": attempt == 1,
                            },
                            ensure_ascii=False,
                        ),
                    },
                ],
                "temperature": 0.0,
                "max_tokens": 500,
                "stream": False,
            }
            response = await request_client.post(
                UPSTAGE_CHAT_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
            if response.status_code != 200:
                if attempt == 0:
                    continue
                raise TranslationError(f"번역 API 응답 오류: {response.status_code}")
            text = response.json()["choices"][0]["message"]["content"].strip()
            text = re.sub(r"^```(?:\w+)?\s*|\s*```$", "", text).strip().strip('"')
            text = re.sub(
                r"^(?:번역(?:문| 결과)?|Translation|Translated text)\s*[:：]\s*",
                "",
                text,
                flags=re.IGNORECASE,
            ).strip()
            if text and text != korean_text and not text.startswith("한국어 원문"):
                return text
        raise TranslationError("번역 LLM이 목표 언어 번역문을 반환하지 않았습니다.")
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
        raise TranslationError("번역 LLM 호출에 실패했습니다.") from exc
    finally:
        if client is None:
            await request_client.aclose()


async def generate_confirmation_message(
    comparison: ComparisonItem,
    tone: ConversationTone,
    user_language: str,
) -> ConfirmationMessageData:
    basis = _comparison_basis(comparison)
    context = {
        "현재 문제": comparison.summary,
        "기록 근거": basis,
        "확인할 항목": _question_items(comparison),
        "말투": tone.value,
    }
    korean_text = ""
    for _ in range(2):
        candidate = await _generate_korean_text(INITIAL_MESSAGE_SYSTEM_PROMPT, context)
        if not _invalid_continuation_message(candidate):
            korean_text = candidate
            break
    if not korean_text:
        korean_text = _fallback_confirmation_message(comparison)
    try:
        translated_text = await translate_confirmation_text(korean_text, user_language)
    except TranslationError:
        translated_text = korean_text
    return ConfirmationMessageData(
        message_id=f"msg_{uuid4().hex}",
        korean_text=korean_text,
        translated_text=translated_text,
        basis=basis,
    )
