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
    ConversationTactic,
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


def test_confirmation_message_uses_llm_result_without_legal_conclusion(monkeypatch) -> None:
    async def fake_generate(_prompt: str, context: dict) -> str:
        assert "계약기간" in context["확인할 항목"]
        return "계약기간과 수습 여부와 기간을 확인해 주실 수 있을까요?"

    async def fake_translate(text: str, _language: str) -> str:
        return f"VI: {text}"

    monkeypatch.setattr(conversation_service, "_generate_korean_text", fake_generate)
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
    async def fake_generate(_prompt: str, context: dict) -> str:
        assert context["말투"] == "firm"
        return "현재 적용되는 조건을 서면으로 확인해 주세요."

    async def fake_translate(text: str, _language: str) -> str:
        return text

    monkeypatch.setattr(conversation_service, "_generate_korean_text", fake_generate)
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

    async def should_not_save_draft(*_args, **_kwargs):
        raise AssertionError("추천 초안은 실제 대화 기록에 저장하면 안 됩니다.")

    monkeypatch.setattr(conversations, "find_comparison_detail", fake_detail)
    monkeypatch.setattr(conversations, "generate_confirmation_message", fake_generate)
    monkeypatch.setattr(conversations, "save_message", should_not_save_draft)

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
    assert response.json()["data"]["conversation_id"] is None


def test_sent_message_api_saves_only_confirmed_kakao_text(monkeypatch) -> None:
    async def fake_detail(_comparison_id: str):
        return {
            "id": "cmp_001",
            "workplace_id": "work_001",
            "condition_type": "hourly_wage",
        }

    async def fake_get_or_create(_workplace_id: str, _comparison_id: str):
        return {"id": "conv_001"}

    saved_messages: list[dict] = []

    async def fake_save_message(conversation_id: str, sender: str, original_text: str, **kwargs):
        saved_messages.append(
            {
                "conversation_id": conversation_id,
                "sender": sender,
                "original_text": original_text,
                **kwargs,
            }
        )
        return {
            "id": "msg_sent_001",
            "original_text": original_text,
            "created_at": "2026-08-02T12:00:00Z",
        }

    monkeypatch.setattr(conversations, "find_comparison_detail", fake_detail)
    monkeypatch.setattr(conversations, "get_or_create_conversation", fake_get_or_create)
    monkeypatch.setattr(conversations, "save_message", fake_save_message)

    app = FastAPI()
    app.include_router(conversations.router, prefix="/api/v1/conversations")
    response = TestClient(app).post(
        "/api/v1/conversations/sent-message",
        json={
            "workplace_id": "work_001",
            "comparison_id": "cmp_001",
            "original_text": "시급 계산 근거를 확인해 주세요.",
            "translated_text": "Please confirm the wage calculation.",
            "tone": "clear",
        },
    )

    assert response.status_code == 200
    assert response.json()["data"]["message_id"] == "msg_sent_001"
    assert [message["sender"] for message in saved_messages] == ["assistant"]
    assert saved_messages[0]["analysis_json"] == {
        "message_type": "sent",
        "comparison_id": "cmp_001",
        "condition_type": "hourly_wage",
        "tone": "clear",
    }


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
    async def fake_llm(*_args, **_kwargs):
        return (
            ["수습 여부와 기간"],
            ["계약기간"],
            [],
            [ConversationTactic.CUSTOMARY_CLAIM],
            None,
        )

    async def fake_follow_up(*_args, **_kwargs):
        return "계약기간도 확인해 주실 수 있을까요?"

    async def fake_translate(text: str, _language: str) -> str:
        return f"VI: {text}"

    monkeypatch.setattr(reply_analysis_service, "_llm_coverage", fake_llm)
    monkeypatch.setattr(reply_analysis_service, "_llm_contextual_follow_up", fake_follow_up)
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
    async def fake_llm(*_args, **_kwargs):
        return ([], ["계약기간", "수습 여부와 기간"], [], [], None)

    async def fake_follow_up(*_args, **_kwargs):
        return "관련 내용을 서면으로 알려주세요."

    async def fake_translate(text: str, _language: str) -> str:
        return text

    monkeypatch.setattr(reply_analysis_service, "_llm_coverage", fake_llm)
    monkeypatch.setattr(reply_analysis_service, "_llm_contextual_follow_up", fake_follow_up)
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

    async def fake_messages(_conversation_id: str):
        return []

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
    monkeypatch.setattr(conversations, "list_conversation_messages", fake_messages)
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
    assert [message["sender"] for message in saved_messages] == ["employer"]


def test_clear_current_conversation_api(monkeypatch) -> None:
    cleared: list[tuple[str, str]] = []

    async def fake_clear(conversation_id: str, workplace_id: str) -> bool:
        cleared.append((conversation_id, workplace_id))
        return True

    monkeypatch.setattr(conversations, "clear_conversation_messages", fake_clear)
    app = FastAPI()
    app.include_router(conversations.router, prefix="/api/v1/conversations")

    response = TestClient(app).delete(
        "/api/v1/conversations/conv_001/messages?workplace_id=work_001"
    )

    assert response.status_code == 200
    assert response.json()["data"]["message_id"] == "all"
    assert cleared == [("conv_001", "work_001")]


def test_generic_resolution_api_saves_user_confirmed_outcome(monkeypatch) -> None:
    saved: list[tuple[str, str, str, str]] = []

    async def fake_save(reply_id: str, workplace_id: str, comparison_id: str, outcome: str):
        saved.append((reply_id, workplace_id, comparison_id, outcome))
        return {"conversation_id": "conv_001", "outcome": outcome}

    monkeypatch.setattr(conversations, "save_conversation_resolution", fake_save)
    app = FastAPI()
    app.include_router(conversations.router, prefix="/api/v1/conversations")

    response = TestClient(app).post(
        "/api/v1/conversations/resolution",
        json={
            "workplace_id": "work_001",
            "comparison_id": "cmp_001",
            "reply_id": "msg_001",
            "outcome": "partially_resolved",
        },
    )

    assert response.status_code == 200
    assert response.json()["data"]["outcome"] == "partially_resolved"
    assert "community.html" in response.json()["data"]["next_url"]
    assert saved == [("msg_001", "work_001", "cmp_001", "partially_resolved")]


def test_reply_analysis_uses_previous_unanswered_items(monkeypatch) -> None:
    async def fake_llm(*_args, **_kwargs):
        return (["계약기간"], [], [], [], None)

    async def fake_translate(text: str, _language: str) -> str:
        return text

    async def fake_follow_up(*_args, **_kwargs):
        return "말씀하신 내용이 실제로 반영되면 확인할 수 있는 기록도 부탁드립니다."

    monkeypatch.setattr(reply_analysis_service, "_llm_coverage", fake_llm)
    monkeypatch.setattr(reply_analysis_service, "_llm_contextual_follow_up", fake_follow_up)
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
    assert result.follow_up_korean


def test_reply_analysis_tracks_employer_commitment_and_next_action(monkeypatch) -> None:
    async def fake_llm(*_args, **_kwargs):
        return (
            ["계약기간"],
            [],
            [],
            [],
            None,
            {
                "commitments": [
                    {
                        "action": "누락된 급여를 반영한다",
                        "due_date": "2026-08-10",
                        "amount": None,
                        "document": "급여명세서",
                        "claimed_status": "promised",
                    }
                ],
                "next_action_hint": "8월 10일 이후 입금내역과 급여명세서를 확인하세요.",
            },
        )

    async def fake_follow_up(*_args, **_kwargs):
        return "반영된 급여명세서도 함께 받을 수 있을까요?"

    async def fake_translate(text: str, _language: str) -> str:
        return text

    monkeypatch.setattr(reply_analysis_service, "_llm_coverage", fake_llm)
    monkeypatch.setattr(reply_analysis_service, "_llm_contextual_follow_up", fake_follow_up)
    monkeypatch.setattr(reply_analysis_service, "translate_confirmation_text", fake_translate)

    result = asyncio.run(
        reply_analysis_service.analyze_employer_reply(
            _comparison(),
            "8월 10일에 누락된 급여를 반영할게요.",
            "ko",
            ConversationTone.CLEAR,
            required_items_override=["계약기간"],
        )
    )

    assert result.case_status == "waiting_for_action"
    assert result.commitments[0].due_date == "2026-08-10"
    assert result.next_action.type == "wait_and_verify"
    assert result.next_action.due_date == "2026-08-10"
    assert result.rights_assertion_mode is True
    assert result.official_basis_title == "최저임금법 제6조"


def test_rule_commitments_restore_split_payment_and_completed_action() -> None:
    promised = reply_analysis_service._rule_based_commitments(
        "절반은 내일 입금하고 나머지는 다음 주 금요일에 보내줄게."
    )
    completed = reply_analysis_service._rule_based_commitments(
        "오늘부터 12시부터 1시까지 쉬도록 근무표를 수정했어."
    )

    assert promised[0].claimed_status == "promised"
    assert "내일" in promised[0].due_date
    assert "다음 주 금요일" in promised[0].due_date
    assert "절반" in promised[0].amount
    assert completed[0].claimed_status == "claimed_completed"
    assert completed[0].document == "근무표"

    pending_review = reply_analysis_service._rule_based_commitments(
        "다음 주부터는 9시부터 7시까지만 하고 지난 추가 근무는 확인해 볼게."
    )
    assert pending_review[0].claimed_status == "promised"
    assert pending_review[0].due_date == "다음 주"

    schedule = reply_analysis_service._rule_based_commitments(
        "계약시간대로 새 근무표를 만들어서 방금 보냈어."
    )
    cash = reply_analysis_service._rule_based_commitments(
        "어제 밀린 급여를 현금으로 전부 줬어."
    )
    break_promise = reply_analysis_service._rule_based_commitments(
        "내일부터 한 시간 쉬게 하고 근무표에도 넣을게."
    )
    assert schedule[0].claimed_status == "claimed_completed"
    assert cash[0].claimed_status == "claimed_completed"
    assert cash[0].due_date == "어제"
    assert break_promise[0].claimed_status == "promised"


def test_follow_up_rejects_repeated_greeting_and_formal_closing(monkeypatch) -> None:
    outputs = iter(
        [
            "안녕하세요, 사장님. 적용 시점을 알려주시면 감사하겠습니다.",
            "현재 적용 시점과 변경 근거, 처리 계획을 서면으로 알려주세요.",
        ]
    )

    async def fake_raw(*_args, **_kwargs):
        return next(outputs)

    monkeypatch.setattr(reply_analysis_service, "_llm_contextual_follow_up_raw", fake_raw)
    result = asyncio.run(
        reply_analysis_service._llm_contextual_follow_up(
            "다른 직원들도 다 그렇게 해.",
            ["실제 적용 시점", "변경 합의 기록"],
            ConversationTone.CLEAR,
            [{"sender": "assistant", "original_text": "근무시간 기록을 확인해 주세요."}],
            _comparison(),
        )
    )

    assert result == "현재 적용 시점과 변경 근거, 처리 계획을 서면으로 알려주세요."


def test_initial_message_retries_greeting_and_thanks(monkeypatch) -> None:
    outputs = iter(
        [
            "사장님, 적용 기준을 알려 주시면 감사하겠습니다.",
            "기록이 서로 다른데 현재 적용 기준과 변경 시점을 알려주세요.",
        ]
    )

    async def fake_generate(*_args, **_kwargs):
        return next(outputs)

    async def fake_translate(text: str, _language: str):
        return text

    monkeypatch.setattr(conversation_service, "_generate_korean_text", fake_generate)
    monkeypatch.setattr(conversation_service, "translate_confirmation_text", fake_translate)
    result = asyncio.run(
        conversation_service.generate_confirmation_message(
            _comparison(), ConversationTone.CLEAR, "ko"
        )
    )

    assert result.korean_text == "기록이 서로 다른데 현재 적용 기준과 변경 시점을 알려주세요."


def test_intimidation_patterns_cover_schedule_and_employment_retaliation() -> None:
    required = ["현재 적용 기준"]
    for reply in (
        "계속 따지면 다음 달부터 근무 빼버릴 거야.",
        "신고하고 싶으면 해. 앞으로 여기서 일 못 할 줄 알아.",
    ):
        tactics = reply_analysis_service._tactics(reply, required)
        assert any(item.type == "intimidating" for item in tactics)


def test_reply_analysis_escalates_explicit_refusal(monkeypatch) -> None:
    async def fake_llm(*_args, **_kwargs):
        return ([], ["계약기간"], [], [], None)

    async def fake_follow_up(*args, **_kwargs):
        assert args[-1] is True
        return "지급 거부 답변은 서면 기록으로 보관하겠습니다."

    async def fake_translate(text: str, _language: str) -> str:
        return text

    monkeypatch.setattr(reply_analysis_service, "_llm_coverage", fake_llm)
    monkeypatch.setattr(reply_analysis_service, "_llm_contextual_follow_up", fake_follow_up)
    monkeypatch.setattr(reply_analysis_service, "translate_confirmation_text", fake_translate)

    result = asyncio.run(
        reply_analysis_service.analyze_employer_reply(
            _comparison(),
            "차액은 줄 수 없고 설명도 안 할 거야.",
            "ko",
            ConversationTone.FIRM,
            required_items_override=["계약기간"],
        )
    )

    assert result.case_status == "escalation_recommended"
    assert result.next_action.type == "official_support"
    assert any(item.type == "explicit_refusal" for item in result.tactics)
