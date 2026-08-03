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


class OpeningMessageRequest(BaseModel):
    workplace_id: str = Field(min_length=1, max_length=100)
    tone: ConversationTone = ConversationTone.POLITE


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


class SentMessageRequest(BaseModel):
    workplace_id: str = Field(min_length=1, max_length=100)
    comparison_id: str = Field(min_length=1, max_length=100)
    original_text: str = Field(min_length=1, max_length=2_000)
    translated_text: str | None = Field(default=None, max_length=2_000)
    tone: ConversationTone = ConversationTone.POLITE
    message_type: str = Field(default="sent", pattern="^(sent|greeting)$")


class SentMessageData(BaseModel):
    message_id: str
    conversation_id: str
    original_text: str
    created_at: str


class SentMessageResponse(BaseModel):
    success: bool
    data: SentMessageData | None
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
    EXPLICIT_REFUSAL = "explicit_refusal"


class CaseStatus(StrEnum):
    COLLECTING_INFORMATION = "collecting_information"
    NEEDS_FOLLOW_UP = "needs_follow_up"
    WAITING_FOR_ACTION = "waiting_for_action"
    WAITING_FOR_EVIDENCE = "waiting_for_evidence"
    USER_CONFIRMATION_NEEDED = "user_confirmation_needed"
    SAFETY_ATTENTION = "safety_attention"
    ESCALATION_RECOMMENDED = "escalation_recommended"


class ResolutionOutcome(StrEnum):
    RESOLVED = "resolved"
    PARTIALLY_RESOLVED = "partially_resolved"
    UNRESOLVED = "unresolved"


class EmployerCommitment(BaseModel):
    action: str
    due_date: str | None = None
    amount: str | None = None
    document: str | None = None
    claimed_status: str = "promised"


class NextAction(BaseModel):
    type: str
    title: str
    description: str
    due_date: str | None = None
    target_url: str | None = None


class ReplyAnalysisRequest(BaseModel):
    workplace_id: str = Field(min_length=1, max_length=100)
    comparison_id: str = Field(min_length=1, max_length=100)
    reply_text: str = Field(min_length=1, max_length=2_000)
    original_language: str = Field(default="ko", min_length=2, max_length=10)
    tone: ConversationTone = ConversationTone.CLEAR
    message_id: str | None = Field(default=None, max_length=100)


class MessageEditRequest(BaseModel):
    workplace_id: str = Field(min_length=1, max_length=100)
    original_text: str = Field(min_length=1, max_length=2_000)


class MessageMutationData(BaseModel):
    message_id: str


class MessageMutationResponse(BaseModel):
    success: bool
    data: MessageMutationData | None
    error: ApiError | None


class ResolutionRequest(BaseModel):
    workplace_id: str = Field(min_length=1, max_length=100)
    comparison_id: str = Field(min_length=1, max_length=100)
    reply_id: str = Field(min_length=1, max_length=100)
    outcome: ResolutionOutcome


class ResolutionData(BaseModel):
    conversation_id: str
    comparison_id: str
    outcome: ResolutionOutcome
    next_url: str | None = None


class ResolutionResponse(BaseModel):
    success: bool
    data: ResolutionData | None
    error: ApiError | None


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
    translated_reply: str = ""
    follow_up_korean: str
    translated_follow_up: str
    case_status: CaseStatus = CaseStatus.COLLECTING_INFORMATION
    commitments: list[EmployerCommitment] = Field(default_factory=list)
    next_action: NextAction | None = None
    resolution_requires_user_confirmation: bool = True
    rights_assertion_mode: bool = False
    official_basis_title: str | None = None
    official_basis_url: str | None = None


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
