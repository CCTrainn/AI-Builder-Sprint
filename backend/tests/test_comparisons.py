"""ROLE-BE-RECORDS 비교 기능 테스트."""

import asyncio
from types import SimpleNamespace

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import comparisons
from app.services.comparison_service import compare_record_conditions
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
                        "항": [
                            {"항내용": "사용자는 최저임금액 이상을 지급해야 한다."}
                        ],
                    }
                }
            },
        )

    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await get_law_reference("hourly_wage", client=client)

    result = asyncio.run(run())

    assert result["article"] == (
        "제6조(최저임금의 효력)\n"
        "사용자는 최저임금액 이상을 지급해야 한다."
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
