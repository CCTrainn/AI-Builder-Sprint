"""확인 문장 생성과 고용주 답변 분석 API.

담당: ROLE-BE-CONVERSATION
"""

import re

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.db.tables_conversations import (
    ConversationDatabaseError,
    find_latest_unanswered_items,
    find_open_conversation,
    get_or_create_conversation,
    list_conversation_messages,
    save_message,
)
from app.db.tables_records import RecordDatabaseError, find_comparison_detail
from app.schemas.comparisons import ComparisonItem, LegalReference
from app.schemas.conversations import (
    ConfirmationMessageRequest,
    ConfirmationMessageResponse,
    ConversationHistoryData,
    ConversationHistoryItem,
    ConversationHistoryResponse,
    ReplyAnalysisRequest,
    ReplyAnalysisResponse,
)
from app.schemas.records import ApiError
from app.services.conversation_service import generate_confirmation_message
from app.services.reply_analysis_service import analyze_employer_reply

router = APIRouter()
WORKPLACE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,100}$")


def _comparison_from_row(row: dict) -> ComparisonItem:
    values = row.get("values") or {}
    return ComparisonItem(
        comparison_id=row["id"],
        condition=row["condition_type"],
        promised=values.get("promised"),
        contracted=values.get("contracted"),
        actual=values.get("actual"),
        status=row["status"],
        summary=row["summary"],
        confirmation_items=row.get("confirmation_items") or [],
        legal_reference=LegalReference(**(row.get("legal_reference") or {})),
    )


@router.post("/message", response_model=ConfirmationMessageResponse)
async def create_confirmation_message(
    request: ConfirmationMessageRequest,
) -> ConfirmationMessageResponse | JSONResponse:
    if not WORKPLACE_ID_PATTERN.fullmatch(request.workplace_id):
        response = ConfirmationMessageResponse(
            success=False,
            data=None,
            error=ApiError(
                code="INVALID_WORKPLACE_ID", message="사업장 정보 형식이 올바르지 않습니다."
            ),
        )
        return JSONResponse(status_code=422, content=response.model_dump(mode="json"))

    try:
        row = await find_comparison_detail(request.comparison_id)
    except RecordDatabaseError:
        response = ConfirmationMessageResponse(
            success=False,
            data=None,
            error=ApiError(
                code="COMPARISON_LOOKUP_FAILED", message="비교 결과를 불러오지 못했습니다."
            ),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))

    if row is None or row.get("workplace_id") != request.workplace_id:
        response = ConfirmationMessageResponse(
            success=False,
            data=None,
            error=ApiError(
                code="COMPARISON_NOT_FOUND", message="해당 사업장의 비교 결과를 찾을 수 없습니다."
            ),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))

    comparison = _comparison_from_row(row)
    message = await generate_confirmation_message(
        comparison,
        request.tone,
        request.user_language,
    )
    try:
        conversation = await get_or_create_conversation(
            request.workplace_id,
            request.comparison_id,
        )
        message.conversation_id = conversation["id"]
        await save_message(
            message.conversation_id,
            "assistant",
            message.korean_text,
            translated_text=message.translated_text,
            analysis_json={"basis": message.basis, "tone": request.tone.value},
        )
    except ConversationDatabaseError:
        response = ConfirmationMessageResponse(
            success=False,
            data=None,
            error=ApiError(
                code="CONVERSATION_SAVE_FAILED", message="대화 기록을 저장하지 못했습니다."
            ),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))
    return ConfirmationMessageResponse(success=True, data=message, error=None)


@router.post("/reply-analysis", response_model=ReplyAnalysisResponse)
async def analyze_reply(
    request: ReplyAnalysisRequest,
) -> ReplyAnalysisResponse | JSONResponse:
    if not WORKPLACE_ID_PATTERN.fullmatch(request.workplace_id):
        response = ReplyAnalysisResponse(
            success=False,
            data=None,
            error=ApiError(
                code="INVALID_WORKPLACE_ID", message="사업장 정보 형식이 올바르지 않습니다."
            ),
        )
        return JSONResponse(status_code=422, content=response.model_dump(mode="json"))

    try:
        row = await find_comparison_detail(request.comparison_id)
    except RecordDatabaseError:
        response = ReplyAnalysisResponse(
            success=False,
            data=None,
            error=ApiError(
                code="COMPARISON_LOOKUP_FAILED", message="비교 결과를 불러오지 못했습니다."
            ),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))

    if row is None or row.get("workplace_id") != request.workplace_id:
        response = ReplyAnalysisResponse(
            success=False,
            data=None,
            error=ApiError(
                code="COMPARISON_NOT_FOUND", message="해당 사업장의 비교 결과를 찾을 수 없습니다."
            ),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))

    comparison = _comparison_from_row(row)
    try:
        conversation = await find_open_conversation(request.workplace_id, request.comparison_id)
        if conversation is None:
            conversation = await get_or_create_conversation(
                request.workplace_id, request.comparison_id
            )
        prior_unanswered = await find_latest_unanswered_items(conversation["id"])
        analysis = await analyze_employer_reply(
            comparison,
            request.reply_text,
            request.original_language,
            request.tone,
            required_items_override=prior_unanswered or None,
        )
        analysis.conversation_id = conversation["id"]
        await save_message(
            analysis.conversation_id,
            "employer",
            request.reply_text,
            translated_text=analysis.translated_reply,
            analysis_json=analysis.model_dump(mode="json"),
        )
        await save_message(
            analysis.conversation_id,
            "assistant",
            analysis.follow_up_korean,
            translated_text=analysis.translated_follow_up,
            analysis_json={
                "unanswered_items": analysis.unanswered_items,
                "classification": analysis.classification.value,
                "tone": request.tone.value,
            },
        )
    except ConversationDatabaseError:
        response = ReplyAnalysisResponse(
            success=False,
            data=None,
            error=ApiError(
                code="CONVERSATION_SAVE_FAILED", message="대화 기록을 저장하지 못했습니다."
            ),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))
    return ReplyAnalysisResponse(success=True, data=analysis, error=None)


@router.get("/{comparison_id}/history", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    comparison_id: str,
    workplace_id: str,
) -> ConversationHistoryResponse | JSONResponse:
    if not WORKPLACE_ID_PATTERN.fullmatch(workplace_id):
        response = ConversationHistoryResponse(
            success=False,
            data=None,
            error=ApiError(
                code="INVALID_WORKPLACE_ID", message="사업장 정보 형식이 올바르지 않습니다."
            ),
        )
        return JSONResponse(status_code=422, content=response.model_dump(mode="json"))
    try:
        conversation = await find_open_conversation(workplace_id, comparison_id)
        if conversation is None:
            response = ConversationHistoryResponse(
                success=False,
                data=None,
                error=ApiError(
                    code="CONVERSATION_NOT_FOUND", message="대화 기록을 찾을 수 없습니다."
                ),
            )
            return JSONResponse(status_code=404, content=response.model_dump(mode="json"))
        messages = await list_conversation_messages(conversation["id"])
    except ConversationDatabaseError:
        response = ConversationHistoryResponse(
            success=False,
            data=None,
            error=ApiError(
                code="CONVERSATION_LOOKUP_FAILED", message="대화 기록을 불러오지 못했습니다."
            ),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))

    return ConversationHistoryResponse(
        success=True,
        data=ConversationHistoryData(
            conversation_id=conversation["id"],
            messages=[
                ConversationHistoryItem(
                    message_id=item["id"],
                    sender=item["sender"],
                    original_text=item["original_text"],
                    translated_text=item.get("translated_text"),
                    analysis=item.get("analysis_json") or {},
                    created_at=item["created_at"],
                )
                for item in messages
            ],
        ),
        error=None,
    )
