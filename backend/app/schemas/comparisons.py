"""근로자료 비교 API 응답 스키마."""

from enum import StrEnum

from pydantic import BaseModel, Field

from app.schemas.records import ApiError


class ComparisonStatus(StrEnum):
    SAME = "same"
    DIFFERENT = "different"
    MISSING = "missing"
    NEEDS_CONFIRMATION = "needs_confirmation"


class ComparisonValue(BaseModel):
    value: int | float | str | None
    unit: str | None = None
    record_id: str


class LegalReference(BaseModel):
    title: str = "관련 공식 정보"
    article: str | None = None
    source_url: str = "https://www.law.go.kr/"


class ComparisonItem(BaseModel):
    comparison_id: str
    condition: str
    promised: ComparisonValue | None = None
    contracted: ComparisonValue | None = None
    actual: ComparisonValue | None = None
    status: ComparisonStatus
    summary: str
    confirmation_items: list[str] = Field(default_factory=list)
    legal_reference: LegalReference = Field(default_factory=LegalReference)


class ComparisonData(BaseModel):
    workplace_id: str
    comparisons: list[ComparisonItem] = Field(default_factory=list)


class ComparisonResponse(BaseModel):
    success: bool
    data: ComparisonData | None
    error: ApiError | None


class ComparisonDetailData(BaseModel):
    workplace_id: str
    comparison: ComparisonItem


class ComparisonDetailResponse(BaseModel):
    success: bool
    data: ComparisonDetailData | None
    error: ApiError | None
