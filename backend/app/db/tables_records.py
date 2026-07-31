"""근무지, 근로자료, 추출 조건, 비교 결과 테이블.

담당: ROLE-BE-RECORDS
실제 모델 추가 전 docs/database.md와 일치하는지 확인한다.
"""

from typing import Any
from uuid import uuid4

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


async def list_workplace_records(workplace_id: str) -> list[dict[str, Any]]:
    """사업장의 기록을 최신 자료 순서로 조회하고 조건 개수를 붙인다."""

    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            records_response = await client.get(
                f"{url}/rest/v1/records",
                headers=_headers(),
                params={
                    "workplace_id": f"eq.{workplace_id}",
                    "select": (
                        "id,record_type,original_file_name,recorded_at,"
                        "processing_status,created_at"
                    ),
                    "order": "recorded_at.desc,created_at.desc",
                },
            )
            if records_response.status_code != 200:
                raise RecordDatabaseError(
                    f"records 목록 조회에 실패했습니다. status={records_response.status_code}"
                )
            record_rows = records_response.json()
            if not record_rows:
                return []

            ids = ",".join(row["id"] for row in record_rows)
            conditions_response = await client.get(
                f"{url}/rest/v1/extracted_conditions",
                headers=_headers(),
                params={
                    "record_id": f"in.({ids})",
                    "select": "record_id",
                },
            )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("근로자료 목록을 조회하지 못했습니다.") from exc

    if conditions_response.status_code != 200:
        raise RecordDatabaseError(
            f"추출 조건 개수 조회에 실패했습니다. status={conditions_response.status_code}"
        )

    counts: dict[str, int] = {}
    for condition in conditions_response.json():
        record_id = condition["record_id"]
        counts[record_id] = counts.get(record_id, 0) + 1

    return [
        {**row, "condition_count": counts.get(row["id"], 0)}
        for row in record_rows
    ]


async def delete_record(record_id: str) -> None:
    """records 행을 삭제한다. 연결 조건은 DB cascade로 함께 삭제된다."""

    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.delete(
                f"{url}/rest/v1/records",
                headers=_headers(),
                params={"id": f"eq.{record_id}"},
            )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("근로자료를 삭제하지 못했습니다.") from exc

    if response.status_code not in {200, 204}:
        raise RecordDatabaseError(
            f"records 삭제에 실패했습니다. status={response.status_code}"
        )


async def update_record_processing(
    record_id: str,
    *,
    processing_status: str,
    original_text: str | None = None,
) -> None:
    """OCR 처리 상태와 추출 원문을 갱신한다."""

    url, _ = _rest_credentials()
    body: dict[str, Any] = {"processing_status": processing_status}
    if original_text is not None:
        body["original_text"] = original_text

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.patch(
                f"{url}/rest/v1/records",
                headers=_headers(),
                params={"id": f"eq.{record_id}"},
                json=body,
            )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("records 처리 상태를 저장하지 못했습니다.") from exc

    if response.status_code not in {200, 204}:
        raise RecordDatabaseError(
            f"records 처리 상태 저장에 실패했습니다. status={response.status_code}"
        )


async def replace_extracted_conditions(
    record_id: str,
    conditions: list[dict[str, Any]],
) -> None:
    """한 기록의 기존 추출 조건을 새 OCR 결과로 교체한다."""

    url, _ = _rest_credentials()
    headers = _headers()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            deleted = await client.delete(
                f"{url}/rest/v1/extracted_conditions",
                headers=headers,
                params={"record_id": f"eq.{record_id}"},
            )
            if deleted.status_code not in {200, 204}:
                raise RecordDatabaseError(
                    f"기존 추출 조건 정리에 실패했습니다. status={deleted.status_code}"
                )

            if not conditions:
                return

            rows = [
                {
                    "id": f"cond_{uuid4().hex}",
                    "record_id": record_id,
                    **condition,
                }
                for condition in conditions
            ]
            inserted = await client.post(
                f"{url}/rest/v1/extracted_conditions",
                headers=headers,
                json=rows,
            )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("추출 조건을 저장하지 못했습니다.") from exc

    if inserted.status_code not in {200, 201}:
        raise RecordDatabaseError(
            f"추출 조건 저장에 실패했습니다. status={inserted.status_code}"
        )


async def find_extracted_conditions(record_id: str) -> list[dict[str, Any]]:
    """record_id에 연결된 근로조건을 조회한다."""

    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{url}/rest/v1/extracted_conditions",
                headers=_headers(),
                params={
                    "record_id": f"eq.{record_id}",
                    "select": (
                        "condition_type,value_text,value_number,unit,confidence,source_text"
                    ),
                },
            )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("추출 조건을 조회하지 못했습니다.") from exc

    if response.status_code != 200:
        raise RecordDatabaseError(
            f"추출 조건 조회에 실패했습니다. status={response.status_code}"
        )
    return response.json()


async def find_workplace_condition_rows(workplace_id: str) -> list[dict[str, Any]]:
    """사업장 기록과 추출 조건을 비교 서비스가 쓰기 쉬운 행으로 합친다."""

    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            records_response = await client.get(
                f"{url}/rest/v1/records",
                headers=_headers(),
                params={
                    "workplace_id": f"eq.{workplace_id}",
                    "processing_status": "eq.completed",
                    "select": "id,record_type,recorded_at",
                },
            )
            if records_response.status_code != 200:
                raise RecordDatabaseError(
                    f"비교할 records 조회에 실패했습니다. status={records_response.status_code}"
                )
            record_rows = records_response.json()
            if not record_rows:
                return []

            ids = ",".join(row["id"] for row in record_rows)
            conditions_response = await client.get(
                f"{url}/rest/v1/extracted_conditions",
                headers=_headers(),
                params={
                    "record_id": f"in.({ids})",
                    "select": (
                        "record_id,condition_type,value_text,value_number,unit,"
                        "confidence,source_text"
                    ),
                },
            )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("비교할 근로조건을 조회하지 못했습니다.") from exc

    if conditions_response.status_code != 200:
        raise RecordDatabaseError(
            f"비교할 조건 조회에 실패했습니다. status={conditions_response.status_code}"
        )

    records_by_id = {row["id"]: row for row in record_rows}
    return [
        {**condition, **records_by_id[condition["record_id"]]}
        for condition in conditions_response.json()
    ]


async def save_comparisons(
    workplace_id: str,
    comparison_rows: list[dict[str, Any]],
) -> dict[str, str]:
    """조건별 비교 결과를 갱신하고 condition_type별 고정 ID를 반환한다."""

    url, _ = _rest_credentials()
    headers = _headers(return_representation=True)
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            existing_response = await client.get(
                f"{url}/rest/v1/comparisons",
                headers=_headers(),
                params={
                    "workplace_id": f"eq.{workplace_id}",
                    "select": "id,condition_type",
                },
            )
            if existing_response.status_code != 200:
                raise RecordDatabaseError(
                    f"기존 비교 결과 조회에 실패했습니다. status={existing_response.status_code}"
                )

            existing = {
                row["condition_type"]: row["id"] for row in existing_response.json()
            }
            rows = [
                {
                    **row,
                    "id": existing.get(row["condition_type"], row["id"]),
                    "workplace_id": workplace_id,
                }
                for row in comparison_rows
            ]

            if rows:
                saved_response = await client.post(
                    f"{url}/rest/v1/comparisons",
                    headers={
                        **headers,
                        "Prefer": "resolution=merge-duplicates,return=representation",
                    },
                    params={"on_conflict": "workplace_id,condition_type"},
                    json=rows,
                )
                if saved_response.status_code not in {200, 201}:
                    raise RecordDatabaseError(
                        f"비교 결과 저장에 실패했습니다. status={saved_response.status_code}"
                    )
                saved_rows = saved_response.json()
            else:
                saved_rows = []

            current_types = {row["condition_type"] for row in rows}
            obsolete_types = set(existing) - current_types
            for condition_type in obsolete_types:
                deleted = await client.delete(
                    f"{url}/rest/v1/comparisons",
                    headers=_headers(),
                    params={
                        "workplace_id": f"eq.{workplace_id}",
                        "condition_type": f"eq.{condition_type}",
                    },
                )
                if deleted.status_code not in {200, 204}:
                    raise RecordDatabaseError(
                        f"이전 비교 결과 정리에 실패했습니다. status={deleted.status_code}"
                    )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("비교 결과를 DB에 저장하지 못했습니다.") from exc

    return {row["condition_type"]: row["id"] for row in saved_rows}


async def find_comparison_detail(comparison_id: str) -> dict[str, Any] | None:
    """대화 기능에 전달할 비교 결과와 연결 기록의 조건 값을 조회한다."""

    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            comparison_response = await client.get(
                f"{url}/rest/v1/comparisons",
                headers=_headers(),
                params={
                    "id": f"eq.{comparison_id}",
                    "select": "*",
                    "limit": "1",
                },
            )
            if comparison_response.status_code != 200:
                raise RecordDatabaseError(
                    f"비교 상세 조회에 실패했습니다. status={comparison_response.status_code}"
                )
            comparison_rows = comparison_response.json()
            if not comparison_rows:
                return None

            comparison = comparison_rows[0]
            role_record_ids = {
                "promised": comparison.get("promised_record_id"),
                "contracted": comparison.get("contracted_record_id"),
                "actual": comparison.get("actual_record_id"),
            }
            record_ids = [record_id for record_id in role_record_ids.values() if record_id]
            if not record_ids:
                return {**comparison, "values": {}}

            ids = ",".join(record_ids)
            conditions_response = await client.get(
                f"{url}/rest/v1/extracted_conditions",
                headers=_headers(),
                params={
                    "record_id": f"in.({ids})",
                    "condition_type": f"eq.{comparison['condition_type']}",
                    "select": "record_id,value_text,value_number,unit",
                },
            )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("비교 상세 정보를 조회하지 못했습니다.") from exc

    if conditions_response.status_code != 200:
        raise RecordDatabaseError(
            f"비교 조건 값 조회에 실패했습니다. status={conditions_response.status_code}"
        )

    conditions_by_record = {
        row["record_id"]: row for row in conditions_response.json()
    }
    values: dict[str, dict[str, Any]] = {}
    for role, record_id in role_record_ids.items():
        if not record_id:
            continue
        condition = conditions_by_record.get(record_id)
        if condition is None:
            continue
        value = condition.get("value_number")
        if value is None:
            value = condition.get("value_text")
        values[role] = {
            "value": value,
            "unit": condition.get("unit"),
            "record_id": record_id,
        }

    return {**comparison, "values": values}


async def find_cached_law_reference(
    law_name: str,
    article_number: int,
) -> dict[str, Any] | None:
    """법령명과 조번호로 최근 저장된 공식 조문을 조회한다."""

    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{url}/rest/v1/legal_references",
                headers=_headers(),
                params={
                    "law_name": f"eq.{law_name}",
                    "article_number": f"eq.{article_number}",
                    "select": "*",
                    "limit": "1",
                },
            )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("법령 캐시를 조회하지 못했습니다.") from exc

    if response.status_code != 200:
        raise RecordDatabaseError(
            f"법령 캐시 조회에 실패했습니다. status={response.status_code}"
        )
    rows = response.json()
    return rows[0] if rows else None


async def upsert_law_reference(reference: dict[str, Any]) -> None:
    """공식 조문을 법령명·조번호 기준으로 저장하거나 갱신한다."""

    url, _ = _rest_credentials()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{url}/rest/v1/legal_references",
                headers={
                    **_headers(),
                    "Prefer": "resolution=merge-duplicates",
                },
                params={"on_conflict": "law_name,article_number"},
                json=reference,
            )
    except httpx.HTTPError as exc:
        raise RecordDatabaseError("법령 캐시를 저장하지 못했습니다.") from exc

    if response.status_code not in {200, 201}:
        raise RecordDatabaseError(
            f"법령 캐시 저장에 실패했습니다. status={response.status_code}"
        )
