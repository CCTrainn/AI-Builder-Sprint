"""Local SQLite and private file-storage integration tests."""

import asyncio
from pathlib import Path

from app.core.config import get_settings
from app.db.session import reset_initialization_state
from app.db.tables_conversations import (
    find_latest_unanswered_items,
    get_or_create_conversation,
    list_conversation_messages,
    save_message,
)
from app.db.tables_records import (
    find_comparison_detail,
    find_record,
    insert_record,
    replace_extracted_conditions,
    save_comparisons,
    update_record_processing,
)
from app.services.storage_service import delete_object, storage_root, upload_bytes


def _use_temporary_data(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setenv("LOCAL_DATA_DIR", str(tmp_path))
    get_settings.cache_clear()
    reset_initialization_state()


def test_local_record_comparison_and_conversation_round_trip(monkeypatch, tmp_path: Path) -> None:
    _use_temporary_data(monkeypatch, tmp_path)

    async def scenario() -> None:
        await insert_record(
            {
                "id": "rec_contract",
                "workplace_id": "work_001",
                "record_type": "employment_contract",
                "storage_path": "demo-user/work_001/rec_contract/original.pdf",
                "original_file_name": "contract.pdf",
                "original_text": None,
                "recorded_at": "2026-07-01",
                "processing_status": "uploaded",
            }
        )
        await update_record_processing(
            "rec_contract", processing_status="completed", original_text="시급 12,000원"
        )
        await replace_extracted_conditions(
            "rec_contract",
            [
                {
                    "condition_type": "hourly_wage",
                    "value_text": None,
                    "value_number": 12000,
                    "unit": "KRW",
                    "confidence": 0.98,
                    "source_text": "시급 12,000원",
                }
            ],
        )
        record = await find_record("rec_contract")
        assert record is not None
        assert record["processing_status"] == "completed"

        saved = await save_comparisons(
            "work_001",
            [
                {
                    "id": "cmp_wage",
                    "condition_type": "hourly_wage",
                    "promised_record_id": None,
                    "contracted_record_id": "rec_contract",
                    "actual_record_id": None,
                    "status": "missing",
                    "summary": "실제 기록이 더 필요합니다.",
                    "confirmation_items": ["실제 적용 시급"],
                    "legal_reference": {"title": "관련 공식 정보"},
                }
            ],
        )
        assert saved == {"hourly_wage": "cmp_wage"}
        detail = await find_comparison_detail("cmp_wage")
        assert detail is not None
        assert detail["values"]["contracted"]["value"] == 12000

        conversation = await get_or_create_conversation("work_001", "cmp_wage")
        await save_message(conversation["id"], "assistant", "시급을 확인해 주세요.")
        await save_message(
            conversation["id"],
            "employer",
            "나중에 알려줄게요.",
            analysis_json={"unanswered_items": ["실제 적용 시급"]},
        )
        messages = await list_conversation_messages(conversation["id"])
        assert [message["sender"] for message in messages] == ["assistant", "employer"]
        assert await find_latest_unanswered_items(conversation["id"]) == ["실제 적용 시급"]

    try:
        asyncio.run(scenario())
    finally:
        get_settings.cache_clear()
        reset_initialization_state()


def test_local_storage_writes_and_deletes_private_object(monkeypatch, tmp_path: Path) -> None:
    _use_temporary_data(monkeypatch, tmp_path)
    storage_path = "demo-user/work_001/rec_001/original.pdf"

    async def scenario() -> None:
        await upload_bytes(
            storage_path=storage_path,
            file_bytes=b"%PDF-local-demo",
            content_type="application/pdf",
        )
        object_path = storage_root() / Path(*storage_path.split("/"))
        assert object_path.read_bytes() == b"%PDF-local-demo"
        await delete_object(storage_path=storage_path)
        assert not object_path.exists()

    try:
        asyncio.run(scenario())
    finally:
        get_settings.cache_clear()
        reset_initialization_state()
