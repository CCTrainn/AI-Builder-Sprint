"""근로자료 비교 API 응답 스키마."""

from enum import StrEnum

from pydantic import BaseModel, Field

from app.schemas.records import ApiError


class ComparisonStatus(StrEnum):
    SAME = "same"
    DIFFERENT = "different"
    MISSING = "missing"
    NEEDS_CONFIRMATION = "needs_confirmation"


class RightsCheckStatus(StrEnum):
    STANDARD_MISMATCH = "standard_mismatch"
    NEEDS_CONFIRMATION = "needs_confirmation"
    INSUFFICIENT_INFORMATION = "insufficient_information"
    NO_MISMATCH_DETECTED = "no_mismatch_detected"


class PayCalculation(BaseModel):
    label: str
    formula: str
    expected_amount: int
    recorded_amount: int | None = None
    difference: int | None = None
    caveats: list[str] = Field(default_factory=list)


class RightsCheck(BaseModel):
    status: RightsCheckStatus = RightsCheckStatus.INSUFFICIENT_INFORMATION
    rule_code: str = "insufficient_information"
    title: str = "현재 자료로 판단하기 어려움"
    explanation: str = "확인에 필요한 기록이 충분하지 않습니다."
    basis: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    calculation: PayCalculation | None = None


class ComparisonValue(BaseModel):
    value: int | float | str | None
    unit: str | None = None
    record_id: str
    recorded_at: str | None = None


class LegalReference(BaseModel):
    title: str = "관련 공식 정보"
    article: str | None = None
    source_url: str = "https://www.law.go.kr/"
    rights_check: RightsCheck = Field(default_factory=RightsCheck)


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
