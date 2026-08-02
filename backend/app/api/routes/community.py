"""공동 경험 로컬 MVP API. Supabase를 호출하지 않는다."""

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.schemas.community import (
    AnonymizePreviewRequest,
    AnonymizePreviewResponse,
    ExperienceDetailResponse,
    ExperienceGraphResponse,
    ExperienceMatchRequest,
    ExperienceMatchResponse,
)
from app.schemas.records import ApiError
from app.services.anonymization_service import anonymize_preview
from app.services.community_service import build_experience_graph, get_experience
from app.services.similarity_service import find_similar_experiences

router = APIRouter()


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
