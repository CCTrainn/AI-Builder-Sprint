"""국가법령정보 공동활용 API에서 조건별 공식 조문을 조회한다."""

from dataclasses import dataclass
from typing import Any
from urllib.parse import quote

import httpx

from app.core.config import get_settings
from app.db.tables_records import (
    RecordDatabaseError,
    find_cached_law_reference,
    upsert_law_reference,
)

LAW_SEARCH_URL = "https://www.law.go.kr/DRF/lawSearch.do"
LAW_SERVICE_URL = "https://www.law.go.kr/DRF/lawService.do"


@dataclass(frozen=True)
class LawTopic:
    law_name: str
    article_number: int
    article_title: str


LAW_TOPICS = {
    "hourly_wage": LawTopic("최저임금법", 6, "최저임금의 효력"),
    "basic_pay": LawTopic("근로기준법", 43, "임금 지급"),
    "gross_pay": LawTopic("근로기준법", 43, "임금 지급"),
    "deductions": LawTopic("근로기준법", 43, "임금 지급"),
    "net_pay": LawTopic("근로기준법", 43, "임금 지급"),
    "pay_date": LawTopic("근로기준법", 43, "임금 지급"),
    "working_hours": LawTopic("근로기준법", 50, "근로시간"),
    "weekly_working_hours": LawTopic("근로기준법", 50, "근로시간"),
    "total_working_hours": LawTopic("근로기준법", 50, "근로시간"),
    "break_time": LawTopic("근로기준법", 54, "휴게"),
    "weekly_holiday_pay": LawTopic("근로기준법", 55, "휴일"),
    "overtime_hours": LawTopic("근로기준법", 56, "연장·야간 및 휴일 근로"),
    "probation": LawTopic("최저임금법", 5, "최저임금액"),
}

_LAW_REFERENCE_CACHE: dict[LawTopic, dict[str, str | None]] = {}


class LawAPIError(RuntimeError):
    """법령 API가 요청을 처리하지 못했을 때 발생한다."""


def _official_link(topic: LawTopic) -> str:
    return (
        f"https://www.law.go.kr/법령/{quote(topic.law_name)}/"
        f"제{topic.article_number}조"
    )


def _find_value(value: Any, key: str) -> Any | None:
    if isinstance(value, dict):
        if key in value:
            return value[key]
        for child in value.values():
            result = _find_value(child, key)
            if result is not None:
                return result
    elif isinstance(value, list):
        for child in value:
            result = _find_value(child, key)
            if result is not None:
                return result
    return None


def _find_text_values(value: Any, keys: set[str]) -> list[str]:
    values: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            if key in keys and isinstance(child, str) and child.strip():
                values.append(child.strip())
            values.extend(_find_text_values(child, keys))
    elif isinstance(value, list):
        for child in value:
            values.extend(_find_text_values(child, keys))
    return values


def _article_text(payload: Any) -> str | None:
    parts = _find_text_values(
        payload,
        {"조문내용", "항내용", "호내용", "목내용"},
    )
    unique_parts = list(dict.fromkeys(parts))
    return "\n".join(unique_parts) if unique_parts else None


def _article_code(article_number: int) -> str:
    return f"{article_number:04d}00"


async def get_law_reference(
    condition_type: str,
    *,
    client: httpx.AsyncClient | None = None,
) -> dict[str, str | None]:
    """조건에 해당하는 조문을 반환하고 API 키가 없으면 공식 링크만 제공한다."""

    topic = LAW_TOPICS.get(condition_type)
    if topic is None:
        return {
            "title": "관련 공식 정보",
            "article": None,
            "source_url": "https://www.law.go.kr/",
        }

    fallback = {
        "title": f"{topic.law_name} 제{topic.article_number}조 ({topic.article_title})",
        "article": None,
        "source_url": _official_link(topic),
    }
    oc = get_settings().law_api_oc.strip()
    if not oc:
        return fallback
    if topic in _LAW_REFERENCE_CACHE:
        return dict(_LAW_REFERENCE_CACHE[topic])

    try:
        cached = await find_cached_law_reference(
            topic.law_name,
            topic.article_number,
        )
    except RecordDatabaseError:
        cached = None
    if cached and cached.get("article_text"):
        result = {
            **fallback,
            "article": cached["article_text"],
            "source_url": cached.get("source_url") or fallback["source_url"],
        }
        _LAW_REFERENCE_CACHE[topic] = result
        return dict(result)

    owns_client = client is None
    request_client = client or httpx.AsyncClient(timeout=20.0)
    try:
        search = await request_client.get(
            LAW_SEARCH_URL,
            params={
                "OC": oc,
                "target": "law",
                "type": "JSON",
                "query": topic.law_name,
                "display": 5,
            },
        )
        search.raise_for_status()
        law_id = _find_value(search.json(), "법령ID")
        if law_id is None:
            return fallback

        detail = await request_client.get(
            LAW_SERVICE_URL,
            params={
                "OC": oc,
                "target": "law",
                "type": "JSON",
                "ID": law_id,
                "JO": _article_code(topic.article_number),
            },
        )
        detail.raise_for_status()
        article_text = _article_text(detail.json())
    except (httpx.HTTPError, ValueError, TypeError):
        return fallback
    finally:
        if owns_client:
            await request_client.aclose()

    result = {
        **fallback,
        "article": str(article_text).strip() if article_text else None,
    }
    if result["article"]:
        _LAW_REFERENCE_CACHE[topic] = result
        try:
            await upsert_law_reference(
                {
                    "topic": condition_type,
                    "law_name": topic.law_name,
                    "article_number": topic.article_number,
                    "article_title": topic.article_title,
                    "article_text": result["article"],
                    "source_url": result["source_url"],
                }
            )
        except RecordDatabaseError:
            pass
    return dict(result)
