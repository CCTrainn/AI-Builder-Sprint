"""시점별 근로자료 비교 API."""

import asyncio
import re

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.db.tables_records import (
    RecordDatabaseError,
    find_comparison_detail,
    find_workplace_condition_rows,
    save_comparisons,
)
from app.schemas.comparisons import (
    ComparisonData,
    ComparisonDetailData,
    ComparisonDetailResponse,
    ComparisonItem,
    ComparisonResponse,
    LegalReference,
)
from app.schemas.records import ApiError
from app.services.comparison_service import compare_record_conditions
from app.services.law_api_service import get_law_reference

router = APIRouter()
detail_router = APIRouter()
WORKPLACE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,100}$")


@router.post("/{workplace_id}/compare", response_model=ComparisonResponse)
async def compare_workplace(workplace_id: str) -> ComparisonResponse | JSONResponse:
    if not WORKPLACE_ID_PATTERN.fullmatch(workplace_id):
        response = ComparisonResponse(
            success=False,
            data=None,
            error=ApiError(
                code="INVALID_WORKPLACE_ID",
                message="workplace_id 형식이 올바르지 않습니다.",
            ),
        )
        return JSONResponse(status_code=422, content=response.model_dump(mode="json"))

    try:
        rows = await find_workplace_condition_rows(workplace_id)
    except RecordDatabaseError:
        response = ComparisonResponse(
            success=False,
            data=None,
            error=ApiError(
                code="COMPARISON_LOOKUP_FAILED",
                message="비교할 근로자료를 조회하지 못했습니다.",
            ),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))

    comparison_items = compare_record_conditions(rows)
    references = await asyncio.gather(
        *(get_law_reference(item.condition) for item in comparison_items)
    )
    for item, reference in zip(comparison_items, references, strict=True):
        item.legal_reference = LegalReference(
            **reference
        )

    comparison_rows = [
        {
            "id": item.comparison_id,
            "condition_type": item.condition,
            "promised_record_id": (
                item.promised.record_id if item.promised else None
            ),
            "contracted_record_id": (
                item.contracted.record_id if item.contracted else None
            ),
            "actual_record_id": item.actual.record_id if item.actual else None,
            "status": item.status.value,
            "summary": item.summary,
            "confirmation_items": item.confirmation_items,
            "legal_reference": item.legal_reference.model_dump(mode="json"),
        }
        for item in comparison_items
    ]
    try:
        saved_ids = await save_comparisons(workplace_id, comparison_rows)
    except RecordDatabaseError:
        response = ComparisonResponse(
            success=False,
            data=None,
            error=ApiError(
                code="COMPARISON_SAVE_FAILED",
                message="비교 결과를 저장하지 못했습니다.",
            ),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))

    for item in comparison_items:
        item.comparison_id = saved_ids.get(item.condition, item.comparison_id)

    return ComparisonResponse(
        success=True,
        data=ComparisonData(
            workplace_id=workplace_id,
            comparisons=comparison_items,
        ),
        error=None,
    )


@detail_router.get("/{comparison_id}", response_model=ComparisonDetailResponse)
async def get_comparison(
    comparison_id: str,
) -> ComparisonDetailResponse | JSONResponse:
    """대화 도우미가 사용할 비교 결과와 근거를 반환한다."""

    try:
        row = await find_comparison_detail(comparison_id)
    except RecordDatabaseError:
        response = ComparisonDetailResponse(
            success=False,
            data=None,
            error=ApiError(
                code="COMPARISON_LOOKUP_FAILED",
                message="비교 결과를 조회하지 못했습니다.",
            ),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))

    if row is None:
        response = ComparisonDetailResponse(
            success=False,
            data=None,
            error=ApiError(
                code="COMPARISON_NOT_FOUND",
                message="비교 결과를 찾을 수 없습니다.",
            ),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))

    values = row.get("values") or {}
    item = ComparisonItem(
        comparison_id=row["id"],
        condition=row["condition_type"],
        promised=values.get("promised"),
        contracted=values.get("contracted"),
        actual=values.get("actual"),
        status=row["status"],
        summary=row["summary"],
        confirmation_items=row.get("confirmation_items") or [],
        legal_reference=LegalReference(**(row.get("legal_reference") or {})),
    )
    return ComparisonDetailResponse(
        success=True,
        data=ComparisonDetailData(
            workplace_id=row["workplace_id"],
            comparison=item,
        ),
        error=None,
    )
