"""시점별 근로자료 비교 API."""

import re

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.db.tables_records import RecordDatabaseError, find_workplace_condition_rows
from app.schemas.comparisons import ComparisonData, ComparisonResponse, LegalReference
from app.schemas.records import ApiError
from app.services.comparison_service import compare_record_conditions
from app.services.law_api_service import get_law_reference

router = APIRouter()
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
    for item in comparison_items:
        item.legal_reference = LegalReference(
            **await get_law_reference(item.condition)
        )

    return ComparisonResponse(
        success=True,
        data=ComparisonData(
            workplace_id=workplace_id,
            comparisons=comparison_items,
        ),
        error=None,
    )
