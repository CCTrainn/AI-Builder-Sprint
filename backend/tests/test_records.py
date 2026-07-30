"""ROLE-BE-RECORDS 전용 테스트."""

import asyncio
from types import SimpleNamespace

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import records
from app.db.tables_records import RecordDatabaseError
from app.services.extraction_service import extract_conditions
from app.services.ocr_service import OCRConfigurationError, html_to_text, parse_document

app = FastAPI()
app.include_router(records.router, prefix="/api/v1/records")
client = TestClient(app)


def _form_data() -> dict[str, str]:
    return {
        "workplace_id": "work_001",
        "record_type": "employment_contract",
        "recorded_at": "2026-07-30",
    }


def test_upload_pdf_success(monkeypatch) -> None:
    uploaded: dict[str, object] = {}
    inserted: dict[str, object] = {}

    async def fake_upload_bytes(**kwargs) -> None:
        uploaded.update(kwargs)

    async def fake_insert_record(record):
        inserted.update(record)
        return record

    monkeypatch.setattr(records, "upload_bytes", fake_upload_bytes)
    monkeypatch.setattr(records, "insert_record", fake_insert_record)

    response = client.post(
        "/api/v1/records/upload",
        data=_form_data(),
        files={"file": ("대모근로계약서.pdf", b"%PDF-demo", "application/pdf")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["error"] is None
    assert body["data"]["record_type"] == "employment_contract"
    assert body["data"]["file_name"] == "대모근로계약서.pdf"
    assert body["data"]["processing_status"] == "uploaded"
    assert uploaded["content_type"] == "application/pdf"
    assert str(uploaded["storage_path"]).endswith("/original.pdf")
    assert "대모근로계약서" not in str(uploaded["storage_path"])
    assert inserted["original_file_name"] == "대모근로계약서.pdf"


def test_upload_rejects_unsupported_file(monkeypatch) -> None:
    async def should_not_upload(**_kwargs) -> None:
        raise AssertionError("지원하지 않는 파일은 Storage를 호출하면 안 됩니다.")

    monkeypatch.setattr(records, "upload_bytes", should_not_upload)

    response = client.post(
        "/api/v1/records/upload",
        data=_form_data(),
        files={"file": ("memo.txt", b"hello", "text/plain")},
    )

    assert response.status_code == 415
    assert response.json()["error"]["code"] == "UNSUPPORTED_FILE_TYPE"


def test_upload_rejects_empty_file(monkeypatch) -> None:
    async def should_not_upload(**_kwargs) -> None:
        raise AssertionError("빈 파일은 Storage를 호출하면 안 됩니다.")

    monkeypatch.setattr(records, "upload_bytes", should_not_upload)

    response = client.post(
        "/api/v1/records/upload",
        data=_form_data(),
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "EMPTY_FILE"


def test_upload_rejects_file_over_limit(monkeypatch) -> None:
    monkeypatch.setattr(
        records,
        "get_settings",
        lambda: SimpleNamespace(max_upload_bytes=4),
    )

    response = client.post(
        "/api/v1/records/upload",
        data=_form_data(),
        files={"file": ("large.pdf", b"12345", "application/pdf")},
    )

    assert response.status_code == 413
    assert response.json()["error"]["code"] == "FILE_TOO_LARGE"


def test_database_failure_deletes_uploaded_object(monkeypatch) -> None:
    deleted: dict[str, str] = {}

    async def fake_upload_bytes(**_kwargs) -> None:
        return None

    async def fail_insert_record(_record):
        raise RecordDatabaseError("test")

    async def fake_delete_object(*, storage_path: str) -> None:
        deleted["storage_path"] = storage_path

    monkeypatch.setattr(records, "upload_bytes", fake_upload_bytes)
    monkeypatch.setattr(records, "insert_record", fail_insert_record)
    monkeypatch.setattr(records, "delete_object", fake_delete_object)

    response = client.post(
        "/api/v1/records/upload",
        data=_form_data(),
        files={"file": ("contract.pdf", b"%PDF-demo", "application/pdf")},
    )

    assert response.status_code == 502
    assert response.json()["error"]["code"] == "RECORD_SAVE_FAILED"
    assert deleted["storage_path"].endswith("/original.pdf")


def test_get_record_success(monkeypatch) -> None:
    async def fake_find_record(_record_id: str):
        return {
            "id": "rec_001",
            "record_type": "employment_contract",
            "processing_status": "uploaded",
            "original_text": None,
        }

    monkeypatch.setattr(records, "find_record", fake_find_record)

    response = client.get("/api/v1/records/rec_001")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "data": {
            "record_id": "rec_001",
            "record_type": "employment_contract",
            "processing_status": "uploaded",
            "original_text": None,
            "conditions": [],
        },
        "error": None,
    }


def test_html_to_text_preserves_document_rows() -> None:
    result = html_to_text("<table><tr><th>시급</th><td>10,500원</td></tr></table>")

    assert "시급" in result
    assert "10,500원" in result


def test_extract_core_work_conditions() -> None:
    text = """
    시간급: 10,500원
    근로시간 09:00 ~ 18:00
    임금 지급일: 매월 25일
    수습기간 3개월
    주휴수당 별도 지급
    """

    result = {item.type: item for item in extract_conditions(text)}

    assert result["hourly_wage"].value == 10500
    assert result["working_hours"].value == "09:00-18:00"
    assert result["pay_date"].value == 25
    assert result["probation_period"].value == 3
    assert result["weekly_holiday_pay"].value == "별도지급"


def test_parse_document_reads_upstage_html(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.ocr_service.get_settings",
        lambda: SimpleNamespace(upstage_api_key="test-key"),
    )

    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["authorization"] == "Bearer test-key"
        return httpx.Response(
            200,
            json={
                "model": "document-parse",
                "content": {"html": "<p>시간급 10,500원</p>"},
            },
        )

    transport = httpx.MockTransport(handler)

    async def run():
        async with httpx.AsyncClient(transport=transport) as mock_client:
            return await parse_document(
                file_bytes=b"%PDF-demo",
                filename="근로계약서.pdf",
                content_type="application/pdf",
                client=mock_client,
            )

    result = asyncio.run(run())
    assert result.text == "시간급 10,500원"


def test_parse_document_rejects_invalid_key(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.ocr_service.get_settings",
        lambda: SimpleNamespace(upstage_api_key="invalid-key"),
    )

    async def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": {"message": "invalid"}})

    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as mock_client:
            return await parse_document(
                file_bytes=b"%PDF-demo",
                filename="contract.pdf",
                content_type="application/pdf",
                client=mock_client,
            )

    with pytest.raises(OCRConfigurationError, match="유효하지 않습니다"):
        asyncio.run(run())
