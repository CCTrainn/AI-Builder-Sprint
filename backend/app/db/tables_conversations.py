"""대화와 메시지 테이블 접근 함수.

담당: ROLE-BE-CONVERSATION
"""

from typing import Any
from uuid import uuid4

import httpx

from app.core.config import get_settings


class ConversationDatabaseError(RuntimeError):
    """Supabase 대화 테이블 작업 실패."""


def _rest_credentials() -> tuple[str, str]:
    settings = get_settings()
    url = settings.supabase_url.rstrip("/")
    key = settings.supabase_service_role_key.strip()
    if not url or not key:
        raise ConversationDatabaseError(
            "SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 backend/.env에 설정해 주세요."
        )
    return url, key


def _headers(*, return_representation: bool = False) -> dict[str, str]:
    _, key = _rest_credentials()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if return_representation:
        headers["Prefer"] = "return=representation"
    return headers


async def get_or_create_conversation(workplace_id: str, comparison_id: str) -> dict[str, Any]:
    """같은 비교 항목의 열린 대화를 재사용한다."""

    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            existing_response = await client.get(
                f"{url}/rest/v1/conversations",
                headers=_headers(),
                params={
                    "workplace_id": f"eq.{workplace_id}",
                    "comparison_id": f"eq.{comparison_id}",
                    "status": "eq.open",
                    "select": "*",
                    "order": "created_at.desc",
                    "limit": "1",
                },
            )
            if existing_response.status_code != 200:
                raise ConversationDatabaseError(
                    f"conversations 조회에 실패했습니다. status={existing_response.status_code}"
                )
            existing = existing_response.json()
            if existing:
                return existing[0]

            new_conversation = {
                "id": f"conv_{uuid4().hex}",
                "workplace_id": workplace_id,
                "comparison_id": comparison_id,
                "status": "open",
            }
            created_response = await client.post(
                f"{url}/rest/v1/conversations",
                headers=_headers(return_representation=True),
                json=new_conversation,
            )
    except httpx.HTTPError as exc:
        raise ConversationDatabaseError("Supabase 대화 DB에 연결하지 못했습니다.") from exc

    if created_response.status_code not in {200, 201}:
        raise ConversationDatabaseError(
            f"conversations 저장에 실패했습니다. status={created_response.status_code}"
        )
    rows = created_response.json()
    if not rows:
        raise ConversationDatabaseError("conversations 저장 결과가 비어 있습니다.")
    return rows[0]


async def save_message(
    conversation_id: str,
    sender: str,
    original_text: str,
    *,
    translated_text: str | None = None,
    analysis_json: dict[str, Any] | None = None,
) -> dict[str, Any]:
    url, _ = _rest_credentials()
    row = {
        "id": f"msg_{uuid4().hex}",
        "conversation_id": conversation_id,
        "sender": sender,
        "original_text": original_text,
        "translated_text": translated_text,
        "analysis_json": analysis_json or {},
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{url}/rest/v1/messages",
                headers=_headers(return_representation=True),
                json=row,
            )
    except httpx.HTTPError as exc:
        raise ConversationDatabaseError("대화 메시지를 저장하지 못했습니다.") from exc
    if response.status_code not in {200, 201}:
        raise ConversationDatabaseError(
            f"messages 저장에 실패했습니다. status={response.status_code}"
        )
    rows = response.json()
    if not rows:
        raise ConversationDatabaseError("messages 저장 결과가 비어 있습니다.")
    return rows[0]


async def find_open_conversation(workplace_id: str, comparison_id: str) -> dict[str, Any] | None:
    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{url}/rest/v1/conversations",
                headers=_headers(),
                params={
                    "workplace_id": f"eq.{workplace_id}",
                    "comparison_id": f"eq.{comparison_id}",
                    "status": "eq.open",
                    "select": "*",
                    "order": "created_at.desc",
                    "limit": "1",
                },
            )
    except httpx.HTTPError as exc:
        raise ConversationDatabaseError("대화 정보를 조회하지 못했습니다.") from exc
    if response.status_code != 200:
        raise ConversationDatabaseError(
            f"conversations 조회에 실패했습니다. status={response.status_code}"
        )
    rows = response.json()
    return rows[0] if rows else None


async def find_latest_unanswered_items(conversation_id: str) -> list[str]:
    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{url}/rest/v1/messages",
                headers=_headers(),
                params={
                    "conversation_id": f"eq.{conversation_id}",
                    "sender": "eq.employer",
                    "select": "analysis_json",
                    "order": "created_at.desc",
                    "limit": "1",
                },
            )
    except httpx.HTTPError as exc:
        raise ConversationDatabaseError("이전 답변 분석을 조회하지 못했습니다.") from exc
    if response.status_code != 200:
        raise ConversationDatabaseError(
            f"messages 조회에 실패했습니다. status={response.status_code}"
        )
    rows = response.json()
    if not rows:
        return []
    analysis = rows[0].get("analysis_json") or {}
    items = analysis.get("unanswered_items") or []
    return [str(item) for item in items if isinstance(item, str)][:10]


async def list_conversation_messages(conversation_id: str) -> list[dict[str, Any]]:
    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{url}/rest/v1/messages",
                headers=_headers(),
                params={
                    "conversation_id": f"eq.{conversation_id}",
                    "select": "id,sender,original_text,translated_text,analysis_json,created_at",
                    "order": "created_at.asc",
                },
            )
    except httpx.HTTPError as exc:
        raise ConversationDatabaseError("대화 기록을 조회하지 못했습니다.") from exc
    if response.status_code != 200:
        raise ConversationDatabaseError(
            f"messages 조회에 실패했습니다. status={response.status_code}"
        )
    return response.json()
