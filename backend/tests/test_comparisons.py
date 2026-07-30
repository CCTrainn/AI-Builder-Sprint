"""ROLE-BE-RECORDS 비교 기능 테스트."""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import comparisons
from app.services.comparison_service import compare_record_conditions


def _row(
    record_id: str,
    record_type: str,
    value: float,
    recorded_at: str,
) -> dict:
    return {
        "record_id": record_id,
        "record_type": record_type,
        "recorded_at": recorded_at,
        "condition_type": "hourly_wage",
        "value_number": value,
        "value_text": None,
        "unit": "KRW",
    }


def test_compare_detects_different_actual_wage() -> None:
    result = compare_record_conditions(
        [
            _row("rec_job", "job_posting", 12000, "2026-07-01"),
            _row("rec_contract", "employment_contract", 12000, "2026-07-02"),
            _row("rec_pay", "payslip", 10500, "2026-07-30"),
        ]
    )

    assert len(result) == 1
    assert result[0].status == "different"
    assert result[0].promised.value == 12000
    assert result[0].contracted.value == 12000
    assert result[0].actual.value == 10500
    assert "다릅니다" in result[0].summary


def test_compare_reports_missing_actual_record() -> None:
    result = compare_record_conditions(
        [
            _row("rec_job", "job_posting", 12000, "2026-07-01"),
            _row("rec_contract", "employment_contract", 12000, "2026-07-02"),
        ]
    )

    assert result[0].status == "same"
    assert result[0].actual is None


def test_compare_api_returns_envelope(monkeypatch) -> None:
    async def fake_rows(_workplace_id: str):
        return [
            _row("rec_contract", "employment_contract", 12000, "2026-07-02"),
            _row("rec_pay", "payslip", 10500, "2026-07-30"),
        ]

    monkeypatch.setattr(comparisons, "find_workplace_condition_rows", fake_rows)

    app = FastAPI()
    app.include_router(comparisons.router, prefix="/api/v1/workplaces")
    response = TestClient(app).post("/api/v1/workplaces/work_001/compare")

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["comparisons"][0]["status"] == "different"
