"""근로자료 업로드와 조회 API.

담당: ROLE-BE-RECORDS
공통 응답 형식은 docs/api-contract.md를 따른다.
"""

import re
from datetime import date
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.db.tables_records import (
    RecordDatabaseError,
    find_extracted_conditions,
    find_record,
    insert_record,
    replace_extracted_conditions,
    update_record_processing,
)
from app.schemas.records import (
    ApiError,
    ProcessingStatus,
    RecordDetailData,
    RecordDetailResponse,
    RecordType,
    RecordUploadData,
    RecordUploadResponse,
)
from app.services.extraction_service import extract_conditions
from app.services.ocr_service import OCRServiceError, parse_document
from app.services.storage_service import (
    StorageConfigurationError,
    StorageUploadError,
    build_storage_path,
    delete_object,
    upload_bytes,
)

router = APIRouter()

DEMO_USER_ID = "demo-user"
WORKPLACE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,100}$")
CONTENT_TYPE_EXTENSIONS = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def _error_response(*, status_code: int, code: str, message: str) -> JSONResponse:
    response = RecordUploadResponse(
        success=False,
        data=None,
        error=ApiError(code=code, message=message),
    )
    return JSONResponse(status_code=status_code, content=response.model_dump(mode="json"))


async def _read_upload(file: UploadFile, max_bytes: int) -> bytes:
    chunks: list[bytes] = []
    total = 0
    while chunk := await file.read(1024 * 1024):
        total += len(chunk)
        if total > max_bytes:
            raise ValueError("FILE_TOO_LARGE")
        chunks.append(chunk)
    return b"".join(chunks)


async def _process_uploaded_record(
    *,
    record_id: str,
    file_bytes: bytes,
    filename: str,
    content_type: str,
) -> None:
    """업로드 응답 후 OCR과 조건 추출 결과를 DB에 저장한다."""

    try:
        await update_record_processing(
            record_id,
            processing_status=ProcessingStatus.PROCESSING.value,
        )
        ocr_result = await parse_document(
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
        )
        conditions = extract_conditions(ocr_result.text)
        condition_rows = []
        for condition in conditions:
            value_number = (
                float(condition.value)
                if isinstance(condition.value, (int, float))
                else None
            )
            value_text = (
                condition.value if isinstance(condition.value, str) else None
            )
            condition_rows.append(
                {
                    "condition_type": condition.type,
                    "value_text": value_text,
                    "value_number": value_number,
                    "unit": condition.unit,
                    "confidence": condition.confidence,
                    "source_text": condition.source_text,
                }
            )
        await replace_extracted_conditions(record_id, condition_rows)
        await update_record_processing(
            record_id,
            processing_status=ProcessingStatus.COMPLETED.value,
            original_text=ocr_result.text,
        )
    except (OCRServiceError, RecordDatabaseError):
        try:
            await update_record_processing(
                record_id,
                processing_status=ProcessingStatus.FAILED.value,
            )
        except RecordDatabaseError:
            pass


@router.post("/upload", response_model=RecordUploadResponse)
async def upload_record(
    background_tasks: BackgroundTasks,
    workplace_id: Annotated[str, Form()],
    record_type: Annotated[RecordType, Form()],
    recorded_at: Annotated[date, Form()],
    file: Annotated[UploadFile, File()],
) -> RecordUploadResponse | JSONResponse:
    """근로자료 원본을 저장하고 records 메타데이터를 생성한다."""

    if not WORKPLACE_ID_PATTERN.fullmatch(workplace_id):
        return _error_response(
            status_code=422,
            code="INVALID_WORKPLACE_ID",
            message="workplace_id는 영문, 숫자, 밑줄과 하이픈만 사용할 수 있습니다.",
        )

    content_type = (file.content_type or "").lower()
    extension = CONTENT_TYPE_EXTENSIONS.get(content_type)
    if extension is None:
        return _error_response(
            status_code=415,
            code="UNSUPPORTED_FILE_TYPE",
            message="PDF, JPEG, PNG 또는 WEBP 파일만 올릴 수 있습니다.",
        )

    settings = get_settings()
    try:
        file_bytes = await _read_upload(file, settings.max_upload_bytes)
    except ValueError:
        return _error_response(
            status_code=413,
            code="FILE_TOO_LARGE",
            message="파일 크기는 10MB를 넘을 수 없습니다.",
        )
    finally:
        await file.close()

    if not file_bytes:
        return _error_response(
            status_code=400,
            code="EMPTY_FILE",
            message="빈 파일은 올릴 수 없습니다.",
        )

    record_id = f"rec_{uuid4().hex}"
    original_file_name = file.filename or f"original.{extension}"
    storage_path = build_storage_path(
        user_id=DEMO_USER_ID,
        workplace_id=workplace_id,
        record_id=record_id,
        extension=extension,
    )

    try:
        await upload_bytes(
            storage_path=storage_path,
            file_bytes=file_bytes,
            content_type=content_type,
        )
    except StorageConfigurationError as exc:
        return _error_response(
            status_code=500,
            code="STORAGE_NOT_CONFIGURED",
            message=str(exc),
        )
    except StorageUploadError:
        return _error_response(
            status_code=502,
            code="STORAGE_UPLOAD_FAILED",
            message="원본 파일을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        )

    record_row = {
        "id": record_id,
        "workplace_id": workplace_id,
        "record_type": record_type.value,
        "storage_path": storage_path,
        "original_file_name": original_file_name,
        "original_text": None,
        "recorded_at": recorded_at.isoformat(),
        "processing_status": ProcessingStatus.UPLOADED.value,
    }

    try:
        await insert_record(record_row)
    except RecordDatabaseError:
        try:
            await delete_object(storage_path=storage_path)
        except StorageUploadError:
            pass
        return _error_response(
            status_code=502,
            code="RECORD_SAVE_FAILED",
            message="파일 정보 저장에 실패했습니다. 업로드를 다시 시도해 주세요.",
        )

    background_tasks.add_task(
        _process_uploaded_record,
        record_id=record_id,
        file_bytes=file_bytes,
        filename=original_file_name,
        content_type=content_type,
    )

    return RecordUploadResponse(
        success=True,
        data=RecordUploadData(
            record_id=record_id,
            workplace_id=workplace_id,
            record_type=record_type,
            file_name=original_file_name,
            processing_status=ProcessingStatus.UPLOADED,
        ),
        error=None,
    )


@router.get("/{record_id}", response_model=RecordDetailResponse)
async def get_record(record_id: str) -> RecordDetailResponse | JSONResponse:
    """저장된 근로자료의 현재 처리 상태를 조회한다."""

    try:
        row = await find_record(record_id)
        condition_rows = await find_extracted_conditions(record_id)
    except RecordDatabaseError:
        response = RecordDetailResponse(
            success=False,
            data=None,
            error=ApiError(
                code="RECORD_LOOKUP_FAILED",
                message="근로자료를 조회하지 못했습니다.",
            ),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))

    if row is None:
        response = RecordDetailResponse(
            success=False,
            data=None,
            error=ApiError(code="RECORD_NOT_FOUND", message="근로자료를 찾을 수 없습니다."),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))

    return RecordDetailResponse(
        success=True,
        data=RecordDetailData(
            record_id=row["id"],
            record_type=row["record_type"],
            processing_status=row["processing_status"],
            original_text=row.get("original_text"),
            conditions=[
                {
                    "type": item["condition_type"],
                    "value": (
                        item["value_number"]
                        if item.get("value_number") is not None
                        else item.get("value_text")
                    ),
                    "unit": item.get("unit"),
                    "confidence": item.get("confidence"),
                    "source_text": item.get("source_text"),
                }
                for item in condition_rows
            ],
        ),
        error=None,
    )
