"""ROLE-BE-RECORDS 비교 기능 테스트."""

import asyncio
from types import SimpleNamespace

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import comparisons
from app.services.comparison_service import compare_record_conditions, evaluate_rights_check
from app.services.law_api_service import get_law_reference


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


def _condition_row(
    record_id: str,
    record_type: str,
    condition_type: str,
    value: float | str,
    recorded_at: str = "2026-07-30",
    unit: str | None = None,
) -> dict:
    return {
        "record_id": record_id,
        "record_type": record_type,
        "recorded_at": recorded_at,
        "condition_type": condition_type,
        "value_number": value if isinstance(value, (int, float)) else None,
        "value_text": value if isinstance(value, str) else None,
        "unit": unit,
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


def test_rights_check_detects_2026_minimum_wage_mismatch() -> None:
    item = compare_record_conditions([_row("rec_pay", "payslip", 10000, "2026-07-30")])[0]

    check = evaluate_rights_check(item)

    assert check.status == "standard_mismatch"
    assert check.rule_code == "minimum_wage_2026"
    assert "10,320" in check.basis[1]
    assert "수습" in check.missing_information[1]


def test_rights_check_does_not_call_above_minimum_wage_a_violation() -> None:
    item = compare_record_conditions([_row("rec_pay", "payslip", 12000, "2026-07-30")])[0]

    check = evaluate_rights_check(item)

    assert check.status == "no_mismatch_detected"
    assert "위법" not in check.explanation


def test_rights_check_uses_record_year_minimum_wage() -> None:
    item = compare_record_conditions([_row("rec_pay", "payslip", 10000, "2025-06-30")])[0]

    check = evaluate_rights_check(item)

    assert check.status == "standard_mismatch"
    assert check.rule_code == "minimum_wage_2025"
    assert "10,030" in check.basis[1]


def test_bank_deposit_is_compared_with_pay_date_and_net_pay() -> None:
    items = compare_record_conditions(
        [
            _condition_row("rec_contract", "employment_contract", "pay_date", 10, unit="day"),
            _condition_row("rec_payslip", "payslip", "net_pay", 900000, unit="KRW"),
            _condition_row("rec_bank", "bank_deposit", "deposit_date", "2026-08-10 14:00"),
            _condition_row("rec_bank", "bank_deposit", "deposit_amount", 900000, unit="KRW"),
        ]
    )
    by_condition = {item.condition: item for item in items}

    assert by_condition["pay_date"].status == "same"
    assert by_condition["pay_date"].actual.record_id == "rec_bank"
    assert by_condition["net_pay"].status == "same"


def test_equivalent_units_and_time_separators_are_normalized() -> None:
    items = compare_record_conditions(
        [
            _condition_row("rec_job", "job_posting", "weekly_working_hours", 20, unit="hour"),
            _condition_row(
                "rec_contract",
                "employment_contract",
                "weekly_working_hours",
                20,
                unit="hours_per_week",
            ),
            _condition_row("rec_job", "job_posting", "working_hours", "09:00~14:00"),
            _condition_row("rec_contract", "employment_contract", "working_hours", "09:00-14:00"),
        ]
    )
    by_condition = {item.condition: item for item in items}

    assert by_condition["weekly_working_hours"].status == "same"
    assert by_condition["working_hours"].status == "same"


def test_break_time_rule_uses_working_time_without_break() -> None:
    items = compare_record_conditions(
        [
            _condition_row("rec_att", "attendance", "working_hours", "09:00-18:00"),
            _condition_row("rec_att", "attendance", "break_time", "12:00-12:30"),
        ]
    )
    by_condition = {item.condition: item for item in items}

    check = evaluate_rights_check(by_condition["break_time"], items)

    assert check.status == "standard_mismatch"
    assert check.rule_code == "minimum_break_time"
    assert "60분" in check.explanation


def test_weekly_holiday_pay_requests_eligibility_facts() -> None:
    items = compare_record_conditions(
        [
            _condition_row(
                "rec_att", "attendance", "weekly_working_hours", 20, unit="hours_per_week"
            ),
            _condition_row("rec_pay", "payslip", "weekly_holiday_pay", "미포함"),
        ]
    )
    by_condition = {item.condition: item for item in items}

    check = evaluate_rights_check(by_condition["weekly_holiday_pay"], items)

    assert check.status == "needs_confirmation"
    assert check.rule_code == "weekly_holiday_eligibility"
    assert "개근" in check.missing_information[1]


def test_expected_gross_pay_calculation_flags_lower_record() -> None:
    items = compare_record_conditions(
        [
            _condition_row("rec_contract", "employment_contract", "hourly_wage", 12000, unit="KRW"),
            _condition_row("rec_pay", "payslip", "total_working_hours", 80, unit="hours_per_month"),
            _condition_row("rec_pay", "payslip", "overtime_hours", 4, unit="hours_per_month"),
            _condition_row("rec_pay", "payslip", "gross_pay", 900000, unit="KRW"),
        ]
    )
    by_condition = {item.condition: item for item in items}

    check = evaluate_rights_check(by_condition["gross_pay"], items)

    assert check.status == "needs_confirmation"
    assert check.rule_code == "estimated_gross_pay_shortfall"
    assert check.calculation.expected_amount == 984000
    assert check.calculation.recorded_amount == 900000


def test_net_pay_formula_is_checked_against_deposit() -> None:
    items = compare_record_conditions(
        [
            _condition_row("rec_pay", "payslip", "gross_pay", 1000000, unit="KRW"),
            _condition_row("rec_pay", "payslip", "deductions", 80000, unit="KRW"),
            _condition_row("rec_bank", "bank_deposit", "deposit_amount", 900000, unit="KRW"),
        ]
    )
    by_condition = {item.condition: item for item in items}

    check = evaluate_rights_check(by_condition["net_pay"], items)

    assert check.status == "needs_confirmation"
    assert check.rule_code == "net_pay_calculation_difference"
    assert check.calculation.expected_amount == 920000
    assert check.calculation.difference == -20000


def test_compare_api_returns_envelope(monkeypatch) -> None:
    async def fake_rows(_workplace_id: str):
        return [
            _row("rec_contract", "employment_contract", 12000, "2026-07-02"),
            _row("rec_pay", "payslip", 10500, "2026-07-30"),
        ]

    async def fake_law_reference(_condition: str):
        return {
            "title": "최저임금법 제6조",
            "article": None,
            "source_url": "https://www.law.go.kr/",
        }

    async def fake_save(_workplace_id: str, rows):
        return {row["condition_type"]: "cmp_stable" for row in rows}

    monkeypatch.setattr(comparisons, "find_workplace_condition_rows", fake_rows)
    monkeypatch.setattr(comparisons, "get_law_reference", fake_law_reference)
    monkeypatch.setattr(comparisons, "save_comparisons", fake_save)

    app = FastAPI()
    app.include_router(comparisons.router, prefix="/api/v1/workplaces")
    response = TestClient(app).post("/api/v1/workplaces/work_001/compare")

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["comparisons"][0]["status"] == "different"
    assert response.json()["data"]["comparisons"][0]["comparison_id"] == "cmp_stable"
    rights_check = response.json()["data"]["comparisons"][0]["legal_reference"]["rights_check"]
    assert rights_check["status"] == "no_mismatch_detected"


def test_law_reference_falls_back_to_official_article_link(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.law_api_service.get_settings",
        lambda: SimpleNamespace(law_api_oc=""),
    )

    result = asyncio.run(get_law_reference("hourly_wage"))

    assert result["title"].startswith("최저임금법 제6조")
    assert result["article"] is None
    assert result["source_url"].startswith("https://www.law.go.kr/")


def test_law_reference_reads_article_from_api(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.law_api_service.get_settings",
        lambda: SimpleNamespace(law_api_oc="test-oc"),
    )

    async def fake_cached(*_args):
        return None

    async def fake_upsert(_reference):
        return None

    monkeypatch.setattr(
        "app.services.law_api_service.find_cached_law_reference",
        fake_cached,
    )
    monkeypatch.setattr(
        "app.services.law_api_service.upsert_law_reference",
        fake_upsert,
    )

    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("lawSearch.do"):
            return httpx.Response(200, json={"법령": [{"법령ID": "001872"}]})
        return httpx.Response(
            200,
            json={
                "법령": {
                    "조문": {
                        "조문내용": "제6조(최저임금의 효력)",
                        "항": [{"항내용": "사용자는 최저임금액 이상을 지급해야 한다."}],
                    }
                }
            },
        )

    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await get_law_reference("hourly_wage", client=client)

    result = asyncio.run(run())

    assert result["article"] == (
        "제6조(최저임금의 효력)\n사용자는 최저임금액 이상을 지급해야 한다."
    )


def test_comparison_detail_returns_values_for_conversation(monkeypatch) -> None:
    async def fake_detail(_comparison_id: str):
        return {
            "id": "cmp_stable",
            "workplace_id": "demo-e2e",
            "condition_type": "hourly_wage",
            "status": "different",
            "summary": "시급 조건이 기록 사이에서 다릅니다.",
            "confirmation_items": ["시급 계산 기준"],
            "legal_reference": {
                "title": "최저임금법 제6조",
                "article": "공식 조문",
                "source_url": "https://www.law.go.kr/",
            },
            "values": {
                "contracted": {
                    "value": 12000,
                    "unit": "KRW",
                    "record_id": "rec_contract",
                },
                "actual": {
                    "value": 10500,
                    "unit": "KRW",
                    "record_id": "rec_pay",
                },
            },
        }

    monkeypatch.setattr(comparisons, "find_comparison_detail", fake_detail)

    app = FastAPI()
    app.include_router(comparisons.detail_router, prefix="/api/v1/comparisons")
    response = TestClient(app).get("/api/v1/comparisons/cmp_stable")

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["workplace_id"] == "demo-e2e"
    assert body["data"]["comparison"]["contracted"]["value"] == 12000
    assert body["data"]["comparison"]["actual"]["value"] == 10500
    assert body["data"]["comparison"]["legal_reference"]["article"] == "공식 조문"


def test_comparison_detail_returns_not_found(monkeypatch) -> None:
    async def fake_detail(_comparison_id: str):
        return None

    monkeypatch.setattr(comparisons, "find_comparison_detail", fake_detail)

    app = FastAPI()
    app.include_router(comparisons.detail_router, prefix="/api/v1/comparisons")
    response = TestClient(app).get("/api/v1/comparisons/missing")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "COMPARISON_NOT_FOUND"
