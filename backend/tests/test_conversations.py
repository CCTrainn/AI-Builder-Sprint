"""ROLE-BE-CONVERSATION 전용 테스트."""

import asyncio
import json
from types import SimpleNamespace

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import conversations
from app.schemas.comparisons import (
    ComparisonItem,
    ComparisonStatus,
    ComparisonValue,
    LegalReference,
)
from app.schemas.conversations import (
    ConfirmationMessageData,
    ConversationTone,
    ReplyAnalysisData,
)
from app.services import conversation_service, reply_analysis_service


def _comparison() -> ComparisonItem:
    return ComparisonItem(
        comparison_id="cmp_001",
        condition="hourly_wage",
        contracted=ComparisonValue(value=12000, unit="KRW", record_id="rec_contract"),
        actual=ComparisonValue(value=10000, unit="KRW", record_id="rec_payslip"),
        status=ComparisonStatus.DIFFERENT,
        summary="시급 조건이 기록 사이에서 다릅니다.",
        confirmation_items=["시급 계산 근거"],
        legal_reference=LegalReference(
            title="최저임금법 제6조",
            rights_check={
                "status": "standard_mismatch",
                "rule_code": "minimum_wage_2026",
                "title": "2026년 최저임금 기준과 기록이 다름",
                "explanation": "기록된 시급이 기준보다 낮습니다.",
                "basis": ["기록된 시급: 10,000원", "2026년 적용 최저임금: 10,320원"],
                "missing_information": ["계약기간", "수습 여부와 기간"],
            },
        ),
    )


def test_confirmation_message_uses_rule_result_without_legal_conclusion(monkeypatch) -> None:
    async def fake_translate(text: str, _language: str) -> str:
        return f"VI: {text}"

    monkeypatch.setattr(conversation_service, "translate_confirmation_text", fake_translate)

    message = asyncio.run(
        conversation_service.generate_confirmation_message(
            _comparison(),
            ConversationTone.POLITE,
            "vi",
        )
    )

    assert "계약기간" in message.korean_text
    assert "수습 여부와 기간" in message.korean_text
    assert "불법" not in message.korean_text
    assert message.translated_text.startswith("VI:")
    assert "계약 시급 12,000원" in message.basis


def test_firm_confirmation_message_requests_written_response(monkeypatch) -> None:
    async def fake_translate(text: str, _language: str) -> str:
        return text

    monkeypatch.setattr(conversation_service, "translate_confirmation_text", fake_translate)

    message = asyncio.run(
        conversation_service.generate_confirmation_message(
            _comparison(),
            ConversationTone.FIRM,
            "ko",
        )
    )

    assert "서면으로 확인해 주세요" in message.korean_text
    assert message.translated_text == message.korean_text


def test_translation_falls_back_to_korean_without_api_key(monkeypatch) -> None:
    monkeypatch.setattr(
        conversation_service,
        "get_settings",
        lambda: SimpleNamespace(llm_api_key="", upstage_api_key=""),
    )

    result = asyncio.run(
        conversation_service.translate_confirmation_text("확인해 주실 수 있을까요?", "vi")
    )

    assert result == "확인해 주실 수 있을까요?"


def test_translation_calls_upstage_chat_api(monkeypatch) -> None:
    monkeypatch.setattr(
        conversation_service,
        "get_settings",
        lambda: SimpleNamespace(llm_api_key="test-key", upstage_api_key=""),
    )

    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url == httpx.URL(conversation_service.UPSTAGE_CHAT_URL)
        assert request.headers["Authorization"] == "Bearer test-key"
        body = json.loads(request.content)
        assert body["model"] == "solar-pro3"
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "Xin vui lòng xác nhận."}}]},
        )

    async def run() -> str:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await conversation_service.translate_confirmation_text(
                "확인해 주세요.",
                "vi",
                client=client,
            )

    assert asyncio.run(run()) == "Xin vui lòng xác nhận."


def test_message_api_reads_comparison_and_returns_envelope(monkeypatch) -> None:
    async def fake_detail(_comparison_id: str):
        comparison = _comparison()
        return {
            "id": comparison.comparison_id,
            "workplace_id": "work_001",
            "condition_type": comparison.condition,
            "status": comparison.status.value,
            "summary": comparison.summary,
            "confirmation_items": comparison.confirmation_items,
            "legal_reference": comparison.legal_reference.model_dump(mode="json"),
            "values": {
                "contracted": comparison.contracted.model_dump(mode="json"),
                "actual": comparison.actual.model_dump(mode="json"),
            },
        }

    async def fake_generate(comparison, tone, user_language):
        assert comparison.condition == "hourly_wage"
        assert tone == ConversationTone.CLEAR
        assert user_language == "vi"
        return ConfirmationMessageData(
            message_id="msg_001",
            korean_text="계산 근거를 알려주세요.",
            translated_text="Please provide the calculation basis.",
            basis=["계약 시급 12,000원"],
        )

    async def fake_get_or_create(_workplace_id: str, _comparison_id: str):
        return {"id": "conv_001"}

    async def fake_save_message(*_args, **_kwargs):
        return {"id": "saved_msg_001"}

    monkeypatch.setattr(conversations, "find_comparison_detail", fake_detail)
    monkeypatch.setattr(conversations, "generate_confirmation_message", fake_generate)
    monkeypatch.setattr(conversations, "get_or_create_conversation", fake_get_or_create)
    monkeypatch.setattr(conversations, "save_message", fake_save_message)

    app = FastAPI()
    app.include_router(conversations.router, prefix="/api/v1/conversations")
    response = TestClient(app).post(
        "/api/v1/conversations/message",
        json={
            "workplace_id": "work_001",
            "comparison_id": "cmp_001",
            "tone": "clear",
            "user_language": "vi",
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["message_id"] == "msg_001"


def test_message_api_hides_comparison_from_another_workplace(monkeypatch) -> None:
    async def fake_detail(_comparison_id: str):
        return {"id": "cmp_001", "workplace_id": "another_workplace"}

    monkeypatch.setattr(conversations, "find_comparison_detail", fake_detail)

    app = FastAPI()
    app.include_router(conversations.router, prefix="/api/v1/conversations")
    response = TestClient(app).post(
        "/api/v1/conversations/message",
        json={"workplace_id": "work_001", "comparison_id": "cmp_001"},
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "COMPARISON_NOT_FOUND"


def test_reply_analysis_keeps_missing_questions_and_detects_customary_claim(monkeypatch) -> None:
    async def fail_llm(*_args, **_kwargs):
        raise reply_analysis_service.ReplyAnalysisLLMError("offline")

    async def fake_translate(text: str, _language: str) -> str:
        return f"VI: {text}"

    monkeypatch.setattr(reply_analysis_service, "_llm_coverage", fail_llm)
    monkeypatch.setattr(reply_analysis_service, "translate_confirmation_text", fake_translate)

    result = asyncio.run(
        reply_analysis_service.analyze_employer_reply(
            _comparison(),
            "수습기간이라 원래 그렇게 계산해요.",
            "vi",
            ConversationTone.CLEAR,
        )
    )

    assert result.classification == "partly_answered"
    assert "계약기간" in result.unanswered_items
    assert any(item.type == "customary_claim" for item in result.tactics)
    assert "수습 여부와 기간" in result.answered_items
    assert result.translated_follow_up.startswith("VI:")
    assert "불법" not in result.follow_up_korean


def test_reply_analysis_enables_safety_mode_for_intimidating_reply(monkeypatch) -> None:
    async def fail_llm(*_args, **_kwargs):
        raise reply_analysis_service.ReplyAnalysisLLMError("offline")

    async def fake_translate(text: str, _language: str) -> str:
        return text

    monkeypatch.setattr(reply_analysis_service, "_llm_coverage", fail_llm)
    monkeypatch.setattr(reply_analysis_service, "translate_confirmation_text", fake_translate)

    result = asyncio.run(
        reply_analysis_service.analyze_employer_reply(
            _comparison(),
            "계속 그러면 해고할 거예요. 신고해 봐요.",
            "ko",
            ConversationTone.FIRM,
        )
    )

    assert result.safety_mode is True
    assert result.classification == "unclear"
    assert "원문과 시간을 보관" in result.safety_note
    assert "서면으로 알려주세요" in result.follow_up_korean


def test_reply_analysis_api_returns_structured_result(monkeypatch) -> None:
    async def fake_detail(_comparison_id: str):
        comparison = _comparison()
        return {
            "id": comparison.comparison_id,
            "workplace_id": "work_001",
            "condition_type": comparison.condition,
            "status": comparison.status.value,
            "summary": comparison.summary,
            "confirmation_items": comparison.confirmation_items,
            "legal_reference": comparison.legal_reference.model_dump(mode="json"),
            "values": {
                "contracted": comparison.contracted.model_dump(mode="json"),
                "actual": comparison.actual.model_dump(mode="json"),
            },
        }

    async def fake_analysis(*_args, **_kwargs):
        return ReplyAnalysisData(
            reply_id="reply_001",
            classification="partly_answered",
            claims=[{"text": "수습기간이라고 주장함", "status": "claimed"}],
            answered_items=["수습 여부와 기간"],
            unanswered_items=["계약기간"],
            tactics=[],
            evidence_check={
                "status": "record_standard_difference",
                "explanation": "근거 확인 필요",
            },
            follow_up_korean="계약기간을 알려주세요.",
            translated_follow_up="Please provide the contract period.",
        )

    saved_messages: list[dict] = []

    async def fake_find_open(_workplace_id: str, _comparison_id: str):
        return {"id": "conv_001"}

    async def fake_unanswered(_conversation_id: str):
        return ["계약기간", "수습 여부와 기간"]

    async def fake_save_message(conversation_id: str, sender: str, original_text: str, **kwargs):
        saved_messages.append(
            {
                "conversation_id": conversation_id,
                "sender": sender,
                "original_text": original_text,
                **kwargs,
            }
        )
        return {"id": f"saved_{len(saved_messages)}"}

    monkeypatch.setattr(conversations, "find_comparison_detail", fake_detail)
    monkeypatch.setattr(conversations, "analyze_employer_reply", fake_analysis)
    monkeypatch.setattr(conversations, "find_open_conversation", fake_find_open)
    monkeypatch.setattr(conversations, "find_latest_unanswered_items", fake_unanswered)
    monkeypatch.setattr(conversations, "save_message", fake_save_message)

    app = FastAPI()
    app.include_router(conversations.router, prefix="/api/v1/conversations")
    response = TestClient(app).post(
        "/api/v1/conversations/reply-analysis",
        json={
            "workplace_id": "work_001",
            "comparison_id": "cmp_001",
            "reply_text": "수습기간이라 원래 그렇게 계산해요.",
            "original_language": "vi",
        },
    )

    assert response.status_code == 200
    assert response.json()["data"]["classification"] == "partly_answered"
    assert response.json()["data"]["claims"][0]["status"] == "claimed"
    assert response.json()["data"]["conversation_id"] == "conv_001"
    assert [message["sender"] for message in saved_messages] == ["employer", "assistant"]


def test_reply_analysis_uses_previous_unanswered_items(monkeypatch) -> None:
    async def fail_llm(*_args, **_kwargs):
        raise reply_analysis_service.ReplyAnalysisLLMError("offline")

    async def fake_translate(text: str, _language: str) -> str:
        return text

    monkeypatch.setattr(reply_analysis_service, "_llm_coverage", fail_llm)
    monkeypatch.setattr(reply_analysis_service, "translate_confirmation_text", fake_translate)

    result = asyncio.run(
        reply_analysis_service.analyze_employer_reply(
            _comparison(),
            "계약기간은 1년입니다.",
            "ko",
            ConversationTone.CLEAR,
            required_items_override=["계약기간"],
        )
    )

    assert result.classification == "fully_answered"
    assert result.answered_items == ["계약기간"]
    assert result.unanswered_items == []
