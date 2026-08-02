"""공동 경험 로컬 MVP 테스트."""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import community
from app.schemas.community import ExperienceMatchRequest
from app.services.anonymization_service import anonymize_preview
from app.services.community_service import build_experience_graph, list_demo_experiences
from app.services.similarity_service import find_similar_experiences


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(community.router, prefix="/community")
    return TestClient(app)


def test_demo_experiences_are_synthetic_and_structured() -> None:
    experiences = list_demo_experiences()
    assert len(experiences) == 12
    assert all(item.is_demo for item in experiences)
    assert all(item.region_bucket == "지역 비공개" for item in experiences)
    assert all(item.evidence_types for item in experiences)


def test_similarity_prioritizes_problem_reply_and_evidence() -> None:
    result = find_similar_experiences(
        ExperienceMatchRequest(
            problem_type="hourly_wage_difference",
            industry_category="음식점",
            evidence_types=["employment_contract", "payslip"],
            reply_patterns=["probation_claim"],
        )
    )
    assert result.matches
    assert result.matches[0].experience.experience_id == "demo_exp_01"
    assert result.matches[0].score == 85
    assert "같은 문제 유형" in result.matches[0].similarity_reasons


def test_graph_contains_experience_and_pattern_nodes() -> None:
    graph = build_experience_graph("hourly_wage_difference")
    node_types = {node.node_type for node in graph.nodes}
    assert {"problem", "experience", "reply", "action", "evidence"} <= node_types
    assert graph.center_node_id == "problem:hourly_wage_difference"
    assert graph.is_demo is True
    assert graph.edges


def test_anonymize_preview_removes_direct_identifiers_without_storage() -> None:
    result = anonymize_preview(
        "2026년 7월 18일에 010-1234-5678로 연락했고 12,000원을 받았습니다."
    )
    assert "010-1234-5678" not in result.anonymized_text
    assert "12,000원" not in result.anonymized_text
    assert result.original_is_stored is False
    assert result.safe_to_preview is True


def test_local_api_returns_matches_and_graph_without_database() -> None:
    client = _client()
    match_response = client.post(
        "/community/match",
        json={
            "problem_type": "delayed_payment",
            "evidence_types": ["bank_record"],
            "reply_patterns": ["delay_promise"],
        },
    )
    assert match_response.status_code == 200
    assert match_response.json()["success"] is True

    graph_response = client.get("/community/graph?problem_type=delayed_payment")
    assert graph_response.status_code == 200
    assert graph_response.json()["data"]["center_node_id"] == "problem:delayed_payment"


def test_unknown_experience_returns_404() -> None:
    response = _client().get("/community/experiences/not-found")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "EXPERIENCE_NOT_FOUND"
