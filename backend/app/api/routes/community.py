"""공동 경험 로컬 MVP API. Supabase를 호출하지 않는다."""

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.db.tables_community import (
    create_user_experience,
    list_user_experiences,
    share_user_experience,
)
from app.db.tables_conversations import find_latest_workplace_resolution, list_workplace_messages
from app.db.tables_records import find_workplace_condition_rows
from app.schemas.community import (
    AnonymizePreviewRequest,
    AnonymizePreviewResponse,
    ExperienceDetailResponse,
    ExperienceDraftData,
    ExperienceDraftResponse,
    ExperienceGraphResponse,
    ExperienceMatchRequest,
    ExperienceMatchResponse,
    UserExperienceCreateRequest,
    UserExperienceData,
    UserExperienceListData,
    UserExperienceListResponse,
    UserExperienceResponse,
    UserExperienceShareRequest,
)
from app.schemas.records import ApiError
from app.services.anonymization_service import anonymize_preview
from app.services.community_service import build_experience_graph, get_experience
from app.services.comparison_service import compare_record_conditions
from app.services.similarity_service import find_similar_experiences

router = APIRouter()

CONDITION_TO_PROBLEM = {
    "hourly_wage": "hourly_wage_difference",
    "weekly_holiday_pay": "weekly_holiday_pay",
    "working_hours": "working_hours_changed",
    "weekly_working_hours": "working_hours_changed",
    "total_working_hours": "working_hours_changed",
    "overtime_hours": "working_hours_changed",
    "break_time": "break_time_difference",
    "pay_date": "delayed_payment",
    "gross_pay": "delayed_payment",
    "net_pay": "delayed_payment",
    "probation": "contract_condition_changed",
    "employment_period": "contract_condition_changed",
    "work_days": "working_days_changed",
}


def _draft_value(label: str, value: object, unit: str | None) -> str:
    if unit == "KRW" and isinstance(value, (int, float)):
        return f"{label} {value:,.0f}원"
    return f"{label} {value}"


@router.get("/experience-draft", response_model=ExperienceDraftResponse)
async def make_experience_draft(
    workplace_id: str = Query(min_length=1, max_length=100),
) -> ExperienceDraftResponse | JSONResponse:
    comparisons = compare_record_conditions(await find_workplace_condition_rows(workplace_id))
    different = [item for item in comparisons if item.status.value == "different"]
    priority = {"hourly_wage": 0, "weekly_holiday_pay": 1, "pay_date": 2}
    different.sort(key=lambda item: priority.get(item.condition, 99))
    messages = await list_workplace_messages(workplace_id)
    resolution = await find_latest_workplace_resolution(workplace_id)
    if not different and not messages:
        response = ExperienceDraftResponse(
            success=False,
            data=None,
            error=ApiError(
                code="EXPERIENCE_DRAFT_SOURCE_NOT_FOUND",
                message="자동 초안을 만들 기록이나 실제 대화가 아직 없어요.",
            ),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))

    parts: list[str] = []
    selected = next(
        (
            item
            for item in comparisons
            if resolution and item.comparison_id == resolution.get("comparison_id")
        ),
        different[0] if different else None,
    )
    if selected:
        parts.append(selected.summary)
        for label, value in (
            ("약속 기록", selected.promised),
            ("계약 기록", selected.contracted),
            ("실제 기록", selected.actual),
        ):
            if value is not None:
                parts.append(_draft_value(label, value.value, value.unit))
    sent = next((item for item in reversed(messages) if item["sender"] == "assistant"), None)
    received = next((item for item in reversed(messages) if item["sender"] == "employer"), None)
    if sent:
        parts.append(f"고용주에게 ‘{sent['original_text']}’라고 확인했습니다.")
    if received:
        parts.append(f"고용주에게 ‘{received['original_text']}’라는 답을 받았습니다.")
    outcome = resolution.get("outcome", "in_progress") if resolution else "in_progress"
    ending = {
        "resolved": "실제 기록을 확인해 해결된 것으로 확정했습니다.",
        "partially_resolved": "일부 조건은 반영됐지만 남은 내용이 있어 일부 해결로 확정했습니다.",
        "unresolved": "아직 실제 기록에 반영되지 않아 미해결로 확인했습니다.",
    }.get(outcome, "현재 기록을 더 확인하고 있습니다.")
    parts.append(ending)

    return ExperienceDraftResponse(
        success=True,
        data=ExperienceDraftData(
            workplace_id=workplace_id,
            problem_type=CONDITION_TO_PROBLEM.get(selected.condition, "other") if selected else "other",
            outcome=outcome,
            text=" ".join(parts),
            source_comparison_id=selected.comparison_id if selected else None,
        ),
        error=None,
    )


@router.post("/experiences", response_model=UserExperienceResponse, status_code=201)
async def save_user_experience(request: UserExperienceCreateRequest) -> UserExperienceResponse | JSONResponse:
    if not request.consent_to_store:
        response = UserExperienceResponse(
            success=False,
            data=None,
            error=ApiError(code="STORAGE_CONSENT_REQUIRED", message="내 경험 저장에 동의해 주세요."),
        )
        return JSONResponse(status_code=422, content=response.model_dump(mode="json"))
    preview = anonymize_preview(request.text)
    if not preview.safe_to_preview:
        response = UserExperienceResponse(
            success=False,
            data=None,
            error=ApiError(
                code="IDENTIFYING_TEXT_REVIEW_REQUIRED",
                message="사업장이나 기관을 알아볼 수 있는 표현을 일반화한 뒤 다시 저장해 주세요.",
            ),
        )
        return JSONResponse(status_code=422, content=response.model_dump(mode="json"))
    item = await create_user_experience({
        "workplace_id": request.workplace_id,
        "problem_type": request.problem_type,
        "outcome": request.outcome.value,
        "anonymized_text": preview.anonymized_text,
        "evidence_types": request.evidence_types,
    })
    return UserExperienceResponse(
        success=True,
        data=UserExperienceData(
            experience=item,
            notice="익명화된 내용만 내 로컬 경험 기록에 저장했으며 자동 공개되지 않습니다.",
        ),
        error=None,
    )


@router.get("/experiences", response_model=UserExperienceListResponse)
async def get_user_experiences(workplace_id: str = Query(min_length=1, max_length=100)) -> UserExperienceListResponse:
    items = await list_user_experiences(workplace_id)
    return UserExperienceListResponse(
        success=True,
        data=UserExperienceListData(workplace_id=workplace_id, total=len(items), experiences=items),
        error=None,
    )


@router.post("/experiences/{experience_id}/share", response_model=UserExperienceResponse)
async def share_experience(
    experience_id: str, request: UserExperienceShareRequest
) -> UserExperienceResponse | JSONResponse:
    item = await share_user_experience(experience_id, request.workplace_id)
    if item is None:
        response = UserExperienceResponse(
            success=False,
            data=None,
            error=ApiError(code="USER_EXPERIENCE_NOT_FOUND", message="확정한 경험을 찾을 수 없어요."),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))
    return UserExperienceResponse(
        success=True,
        data=UserExperienceData(
            experience=item,
            notice="익명화된 경험이 공동 경험에 공유됐어요.",
        ),
        error=None,
    )


@router.post("/match", response_model=ExperienceMatchResponse)
async def match_community_experiences(request: ExperienceMatchRequest) -> ExperienceMatchResponse:
    return ExperienceMatchResponse(
        success=True,
        data=find_similar_experiences(request),
        error=None,
    )


@router.get("/graph", response_model=ExperienceGraphResponse)
async def get_community_graph(
    problem_type: str | None = Query(default=None, max_length=100),
) -> ExperienceGraphResponse:
    return ExperienceGraphResponse(
        success=True,
        data=build_experience_graph(problem_type),
        error=None,
    )


@router.get("/experiences/{experience_id}", response_model=ExperienceDetailResponse)
async def get_community_experience(
    experience_id: str,
) -> ExperienceDetailResponse | JSONResponse:
    experience = get_experience(experience_id)
    if experience is None:
        response = ExperienceDetailResponse(
            success=False,
            data=None,
            error=ApiError(code="EXPERIENCE_NOT_FOUND", message="해당 익명 경험을 찾을 수 없습니다."),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))
    return ExperienceDetailResponse(success=True, data=experience, error=None)


@router.post("/anonymize-preview", response_model=AnonymizePreviewResponse)
async def preview_experience_anonymization(
    request: AnonymizePreviewRequest,
) -> AnonymizePreviewResponse:
    return AnonymizePreviewResponse(
        success=True,
        data=anonymize_preview(request.text),
        error=None,
    )
