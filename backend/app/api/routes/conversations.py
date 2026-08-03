"""확인 문장 생성과 고용주 답변 분석 API.

담당: ROLE-BE-CONVERSATION
"""

import re

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.db.tables_conversations import (
    ConversationDatabaseError,
    clear_conversation_messages,
    delete_message,
    find_latest_unanswered_items,
    find_open_conversation,
    get_or_create_conversation,
    list_conversation_messages,
    list_workplace_messages,
    save_conversation_resolution,
    save_message,
    update_message,
)
from app.db.tables_records import RecordDatabaseError, find_comparison_detail
from app.schemas.comparisons import ComparisonItem, LegalReference
from app.schemas.conversations import (
    ConfirmationMessageRequest,
    ConfirmationMessageResponse,
    ConversationHistoryData,
    ConversationHistoryItem,
    ConversationHistoryResponse,
    OpeningMessageRequest,
    MessageEditRequest,
    MessageMutationData,
    MessageMutationResponse,
    ReplyAnalysisRequest,
    ReplyAnalysisResponse,
    ResolutionData,
    ResolutionRequest,
    ResolutionResponse,
    SentMessageData,
    SentMessageRequest,
    SentMessageResponse,
    TranslationData,
    TranslationRequest,
    TranslationResponse,
)
from app.schemas.records import ApiError
from app.services.conversation_service import (
    MessageGenerationError,
    TranslationError,
    generate_confirmation_message,
    generate_opening_message,
    translate_confirmation_text,
)
from app.services.reply_analysis_service import ReplyAnalysisLLMError, analyze_employer_reply

router = APIRouter()
WORKPLACE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,100}$")


@router.post("/translate", response_model=TranslationResponse)
async def translate_message(request: TranslationRequest) -> TranslationResponse | JSONResponse:
    try:
        translated_text = await translate_confirmation_text(request.text, request.user_language)
    except TranslationError as error:
        response = TranslationResponse(
            success=False,
            data=None,
            error=ApiError(code="TRANSLATION_FAILED", message=str(error)),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))
    return TranslationResponse(
        success=True,
        data=TranslationData(translated_text=translated_text),
        error=None,
    )


@router.post("/opening-message", response_model=ConfirmationMessageResponse)
async def create_opening_message(
    request: OpeningMessageRequest,
) -> ConfirmationMessageResponse | JSONResponse:
    if not WORKPLACE_ID_PATTERN.fullmatch(request.workplace_id):
        response = ConfirmationMessageResponse(
            success=False,
            data=None,
            error=ApiError(code="INVALID_WORKPLACE_ID", message="사업장 정보 형식이 올바르지 않습니다."),
        )
        return JSONResponse(status_code=422, content=response.model_dump(mode="json"))
    try:
        korean_text = await generate_opening_message(request.tone)
    except MessageGenerationError as error:
        response = ConfirmationMessageResponse(
            success=False,
            data=None,
            error=ApiError(code="LLM_GENERATION_FAILED", message=str(error)),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))
    return ConfirmationMessageResponse(
        success=True,
        data={
            "message_id": "opening",
            "korean_text": korean_text,
            "translated_text": korean_text,
            "basis": [],
        },
        error=None,
    )


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
    try:
        message = await generate_confirmation_message(
            comparison,
            request.tone,
            request.user_language,
        )
    except (MessageGenerationError, TranslationError) as error:
        response = ConfirmationMessageResponse(
            success=False,
            data=None,
            error=ApiError(code="LLM_GENERATION_FAILED", message=str(error)),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))
    return ConfirmationMessageResponse(success=True, data=message, error=None)


@router.post("/sent-message", response_model=SentMessageResponse)
async def record_sent_message(
    request: SentMessageRequest,
) -> SentMessageResponse | JSONResponse:
    """Store only the text the user confirms was actually sent to the employer."""

    if not WORKPLACE_ID_PATTERN.fullmatch(request.workplace_id):
        response = SentMessageResponse(
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
        response = SentMessageResponse(
            success=False,
            data=None,
            error=ApiError(
                code="COMPARISON_LOOKUP_FAILED", message="비교 결과를 불러오지 못했습니다."
            ),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))
    if row is None or row.get("workplace_id") != request.workplace_id:
        response = SentMessageResponse(
            success=False,
            data=None,
            error=ApiError(
                code="COMPARISON_NOT_FOUND", message="해당 사업장의 비교 결과를 찾을 수 없습니다."
            ),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))

    try:
        conversation = await get_or_create_conversation(
            request.workplace_id, request.comparison_id
        )
        saved = await save_message(
            conversation["id"],
            "assistant",
            request.original_text,
            translated_text=request.translated_text,
            analysis_json={
                "message_type": request.message_type,
                "comparison_id": request.comparison_id,
                "condition_type": row["condition_type"],
                "tone": request.tone.value,
            },
        )
    except ConversationDatabaseError:
        response = SentMessageResponse(
            success=False,
            data=None,
            error=ApiError(
                code="CONVERSATION_SAVE_FAILED", message="보낸 문장을 기록하지 못했습니다."
            ),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))

    return SentMessageResponse(
        success=True,
        data=SentMessageData(
            message_id=saved["id"],
            conversation_id=conversation["id"],
            original_text=saved["original_text"],
            created_at=saved["created_at"],
        ),
        error=None,
    )


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
        prior_messages = await list_conversation_messages(conversation["id"])
        if request.message_id:
            prior_messages = [
                item for item in prior_messages if item.get("id") != request.message_id
            ]
        analysis = await analyze_employer_reply(
            comparison,
            request.reply_text,
            request.original_language,
            request.tone,
            required_items_override=prior_unanswered or None,
            conversation_history=prior_messages,
        )
        analysis.conversation_id = conversation["id"]
        stored_analysis = analysis.model_dump(mode="json")
        stored_analysis["comparison_id"] = request.comparison_id
        if request.message_id:
            saved = await update_message(
                request.message_id,
                request.workplace_id,
                request.reply_text,
                translated_text=analysis.translated_reply,
                analysis_json=stored_analysis,
            )
            if saved is None:
                response = ReplyAnalysisResponse(
                    success=False,
                    data=None,
                    error=ApiError(code="MESSAGE_NOT_FOUND", message="수정할 대화를 찾을 수 없습니다."),
                )
                return JSONResponse(status_code=404, content=response.model_dump(mode="json"))
        else:
            saved = await save_message(
                analysis.conversation_id,
                "employer",
                request.reply_text,
                translated_text=analysis.translated_reply,
                analysis_json=stored_analysis,
            )
        analysis.reply_id = saved["id"]
    except ReplyAnalysisLLMError as error:
        response = ReplyAnalysisResponse(
            success=False,
            data=None,
            error=ApiError(code="LLM_GENERATION_FAILED", message=str(error)),
        )
        return JSONResponse(status_code=502, content=response.model_dump(mode="json"))
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


@router.post("/resolution", response_model=ResolutionResponse)
async def confirm_conversation_resolution(
    request: ResolutionRequest,
) -> ResolutionResponse | JSONResponse:
    """조건 종류와 무관하게 사용자가 실제 반영 결과를 확정한다."""

    if not WORKPLACE_ID_PATTERN.fullmatch(request.workplace_id):
        response = ResolutionResponse(
            success=False,
            data=None,
            error=ApiError(code="INVALID_WORKPLACE_ID", message="사업장 정보 형식이 올바르지 않습니다."),
        )
        return JSONResponse(status_code=422, content=response.model_dump(mode="json"))
    try:
        saved = await save_conversation_resolution(
            request.reply_id,
            request.workplace_id,
            request.comparison_id,
            request.outcome.value,
        )
    except ConversationDatabaseError:
        saved = None
    if saved is None:
        response = ResolutionResponse(
            success=False,
            data=None,
            error=ApiError(
                code="RESOLUTION_SOURCE_NOT_FOUND",
                message="현재 문제와 연결된 고용주 답변을 찾지 못했습니다. 답변을 다시 분석해 주세요.",
            ),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))
    next_url = (
        f"../community/community.html?from=completed&workplace_id={request.workplace_id}"
        if request.outcome.value in {"resolved", "partially_resolved"}
        else None
    )
    return ResolutionResponse(
        success=True,
        data=ResolutionData(
            conversation_id=saved["conversation_id"],
            comparison_id=request.comparison_id,
            outcome=request.outcome,
            next_url=next_url,
        ),
        error=None,
    )


@router.patch("/messages/{message_id}", response_model=MessageMutationResponse)
async def edit_conversation_message(
    message_id: str, request: MessageEditRequest
) -> MessageMutationResponse | JSONResponse:
    try:
        updated = await update_message(message_id, request.workplace_id, request.original_text)
    except ConversationDatabaseError:
        updated = None
    if updated is None:
        response = MessageMutationResponse(
            success=False,
            data=None,
            error=ApiError(code="MESSAGE_NOT_FOUND", message="수정할 대화를 찾을 수 없습니다."),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))
    return MessageMutationResponse(
        success=True,
        data=MessageMutationData(message_id=message_id),
        error=None,
    )


@router.delete("/messages/{message_id}", response_model=MessageMutationResponse)
async def remove_conversation_message(
    message_id: str, workplace_id: str
) -> MessageMutationResponse | JSONResponse:
    try:
        deleted = await delete_message(message_id, workplace_id)
    except ConversationDatabaseError:
        deleted = False
    if not deleted:
        response = MessageMutationResponse(
            success=False,
            data=None,
            error=ApiError(code="MESSAGE_NOT_FOUND", message="삭제할 대화를 찾을 수 없습니다."),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))
    return MessageMutationResponse(
        success=True,
        data=MessageMutationData(message_id=message_id),
        error=None,
    )


@router.delete("/{conversation_id}/messages", response_model=MessageMutationResponse)
async def clear_current_conversation(
    conversation_id: str, workplace_id: str
) -> MessageMutationResponse | JSONResponse:
    """현재 대화방의 메시지를 전부 지워 새 AI 맥락으로 시작한다."""

    if not WORKPLACE_ID_PATTERN.fullmatch(workplace_id):
        response = MessageMutationResponse(
            success=False,
            data=None,
            error=ApiError(code="INVALID_WORKPLACE_ID", message="사업장 정보 형식이 올바르지 않습니다."),
        )
        return JSONResponse(status_code=422, content=response.model_dump(mode="json"))
    try:
        cleared = await clear_conversation_messages(conversation_id, workplace_id)
    except ConversationDatabaseError:
        cleared = False
    if not cleared:
        response = MessageMutationResponse(
            success=False,
            data=None,
            error=ApiError(code="CONVERSATION_NOT_FOUND", message="삭제할 현재 대화를 찾을 수 없습니다."),
        )
        return JSONResponse(status_code=404, content=response.model_dump(mode="json"))
    return MessageMutationResponse(
        success=True,
        data=MessageMutationData(message_id="all"),
        error=None,
    )


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
        messages = await list_workplace_messages(workplace_id)
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
