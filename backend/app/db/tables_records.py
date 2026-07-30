"""근무지, 근로자료, 추출 조건, 비교 결과 테이블.

담당: ROLE-BE-RECORDS
실제 모델 추가 전 docs/database.md와 일치하는지 확인한다.
"""

from typing import Any

import httpx

from app.core.config import get_settings


class RecordDatabaseError(RuntimeError):
    """Supabase records 테이블 작업이 실패한 경우."""


def _rest_credentials() -> tuple[str, str]:
    settings = get_settings()
    url = settings.supabase_url.rstrip("/")
    key = settings.supabase_service_role_key.strip()
    if not url or not key:
        raise RecordDatabaseError(
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


async def insert_record(record: dict[str, Any]) -> dict[str, Any]:
    """Supabase PostgREST를 통해 records 행을 저장한다."""

    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{url}/rest/v1/records",
                headers=_headers(return_representation=True),
                json=record,
            )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("Supabase DB에 연결하지 못했습니다.") from exc

    if response.status_code != 201:
        raise RecordDatabaseError(
            f"records 저장에 실패했습니다. status={response.status_code}"
        )

    rows = response.json()
    if not rows:
        raise RecordDatabaseError("records 저장 결과가 비어 있습니다.")
    return rows[0]


async def find_record(record_id: str) -> dict[str, Any] | None:
    """record_id로 근로자료 한 건을 조회한다."""

    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{url}/rest/v1/records",
                headers=_headers(),
                params={"id": f"eq.{record_id}", "select": "*", "limit": "1"},
            )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("Supabase DB에 연결하지 못했습니다.") from exc

    if response.status_code != 200:
        raise RecordDatabaseError(
            f"records 조회에 실패했습니다. status={response.status_code}"
        )

    rows = response.json()
    return rows[0] if rows else None
