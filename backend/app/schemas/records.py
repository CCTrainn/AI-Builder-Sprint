"""근로자료 API 요청/응답 스키마.

담당: ROLE-BE-RECORDS
"""

from enum import StrEnum

from pydantic import BaseModel, Field


class RecordType(StrEnum):
    JOB_POSTING = "job_posting"
    EMPLOYMENT_CONTRACT = "employment_contract"
    EMPLOYER_MESSAGE = "employer_message"
    VERBAL_MEMO = "verbal_memo"
    WORK_SCHEDULE = "work_schedule"
    ATTENDANCE = "attendance"
    PAYSLIP = "payslip"
    BANK_DEPOSIT = "bank_deposit"
    WORKPLACE_NOTICE = "workplace_notice"
    OTHER = "other"


class ProcessingStatus(StrEnum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class RecordUploadData(BaseModel):
    record_id: str
    workplace_id: str
    record_type: RecordType
    file_name: str
    processing_status: ProcessingStatus


class ExtractedCondition(BaseModel):
    type: str
    value: int | float | str | None
    unit: str | None = None
    confidence: float | None = None
    source_text: str | None = None


class RecordDetailData(BaseModel):
    record_id: str
    record_type: RecordType
    processing_status: ProcessingStatus
    original_text: str | None = None
    conditions: list[ExtractedCondition] = Field(default_factory=list)


class ApiError(BaseModel):
    code: str
    message: str


class RecordUploadResponse(BaseModel):
    success: bool
    data: RecordUploadData | None
    error: ApiError | None


class RecordDetailResponse(BaseModel):
    success: bool
    data: RecordDetailData | None
    error: ApiError | None
