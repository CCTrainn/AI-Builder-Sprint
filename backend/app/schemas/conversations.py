"""확인 대화 API 요청/응답 스키마.

담당: ROLE-BE-CONVERSATION
"""

from enum import StrEnum

from pydantic import BaseModel, Field

from app.schemas.records import ApiError


class ConversationTone(StrEnum):
    POLITE = "polite"
    CLEAR = "clear"
    FIRM = "firm"


class ConfirmationMessageRequest(BaseModel):
    workplace_id: str = Field(min_length=1, max_length=100)
    comparison_id: str = Field(min_length=1, max_length=100)
    tone: ConversationTone = ConversationTone.POLITE
    user_language: str = Field(default="ko", min_length=2, max_length=10)


class ConfirmationMessageData(BaseModel):
    message_id: str
    conversation_id: str | None = None
    korean_text: str
    translated_text: str
    basis: list[str] = Field(default_factory=list)


class ConfirmationMessageResponse(BaseModel):
    success: bool
    data: ConfirmationMessageData | None
    error: ApiError | None


class ReplyClassification(StrEnum):
    FULLY_ANSWERED = "fully_answered"
    PARTLY_ANSWERED = "partly_answered"
    NOT_ANSWERED = "not_answered"
    UNCLEAR = "unclear"
    NEW_CONDITION = "new_condition"
    MORE_EVIDENCE_NEEDED = "more_evidence_needed"


class ConversationTactic(StrEnum):
    EVASIVE = "evasive"
    CUSTOMARY_CLAIM = "customary_claim"
    UNSUPPORTED_LEGAL_CLAIM = "unsupported_legal_claim"
    BLAME_SHIFTING = "blame_shifting"
    DELAYING = "delaying"
    NEW_CONDITION = "new_condition"
    INTIMIDATING = "intimidating"


class ReplyAnalysisRequest(BaseModel):
    workplace_id: str = Field(min_length=1, max_length=100)
    comparison_id: str = Field(min_length=1, max_length=100)
    reply_text: str = Field(min_length=1, max_length=2_000)
    original_language: str = Field(default="ko", min_length=2, max_length=10)
    tone: ConversationTone = ConversationTone.CLEAR


class EmployerClaim(BaseModel):
    text: str
    status: str


class TacticDetection(BaseModel):
    type: ConversationTactic
    explanation: str


class EvidenceCheck(BaseModel):
    status: str
    explanation: str


class ReplyAnalysisData(BaseModel):
    reply_id: str
    conversation_id: str | None = None
    classification: ReplyClassification
    claims: list[EmployerClaim] = Field(default_factory=list)
    answered_items: list[str] = Field(default_factory=list)
    unanswered_items: list[str] = Field(default_factory=list)
    tactics: list[TacticDetection] = Field(default_factory=list)
    evidence_check: EvidenceCheck
    safety_mode: bool = False
    safety_note: str | None = None
    follow_up_korean: str
    translated_follow_up: str


class ReplyAnalysisResponse(BaseModel):
    success: bool
    data: ReplyAnalysisData | None
    error: ApiError | None


class ConversationHistoryItem(BaseModel):
    message_id: str
    sender: str
    original_text: str
    translated_text: str | None = None
    analysis: dict = Field(default_factory=dict)
    created_at: str


class ConversationHistoryData(BaseModel):
    conversation_id: str
    messages: list[ConversationHistoryItem] = Field(default_factory=list)


class ConversationHistoryResponse(BaseModel):
    success: bool
    data: ConversationHistoryData | None
    error: ApiError | None
