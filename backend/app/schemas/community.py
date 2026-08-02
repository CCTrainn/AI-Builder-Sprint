"""공동 경험 로컬 MVP의 요청·응답 스키마.

담당: ROLE-COMMUNITY-EXPERIENCE
"""

from enum import StrEnum

from pydantic import BaseModel, Field

from app.schemas.records import ApiError


class ExperienceOutcome(StrEnum):
    RESOLVED = "resolved"
    PARTIALLY_RESOLVED = "partially_resolved"
    UNRESOLVED = "unresolved"
    IN_PROGRESS = "in_progress"


class VerificationLevel(StrEnum):
    DEMO = "demo"
    USER_REPORTED = "user_reported"
    RECORD_CONNECTED = "record_connected"
    PROCESS_CONFIRMED = "process_confirmed"


class ExperienceCase(BaseModel):
    experience_id: str
    problem_type: str
    problem_label: str
    industry_category: str
    region_bucket: str
    evidence_types: list[str] = Field(default_factory=list)
    reply_patterns: list[str] = Field(default_factory=list)
    actions: list[str] = Field(default_factory=list)
    outcome: ExperienceOutcome
    outcome_summary: str
    helpful_action: str
    lesson: str
    verification_level: VerificationLevel = VerificationLevel.DEMO
    is_demo: bool = True


class ExperienceMatchRequest(BaseModel):
    problem_type: str
    industry_category: str | None = None
    evidence_types: list[str] = Field(default_factory=list)
    reply_patterns: list[str] = Field(default_factory=list)
    current_stage: ExperienceOutcome | None = None
    limit: int = Field(default=4, ge=1, le=10)


class SimilarExperience(BaseModel):
    experience: ExperienceCase
    score: int
    similarity_reasons: list[str]


class ExperienceMatchData(BaseModel):
    matches: list[SimilarExperience]
    total_demo_experiences: int
    notice: str


class ExperienceMatchResponse(BaseModel):
    success: bool
    data: ExperienceMatchData | None
    error: ApiError | None


class GraphNode(BaseModel):
    node_id: str
    node_type: str
    label: str
    count: int = 1
    verification_level: VerificationLevel = VerificationLevel.DEMO
    experience_id: str | None = None
    description: str | None = None


class GraphEdge(BaseModel):
    source: str
    target: str
    relation: str
    weight: int = 1


class ExperienceGraphData(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    center_node_id: str | None = None
    is_demo: bool = True
    privacy_notice: str


class ExperienceGraphResponse(BaseModel):
    success: bool
    data: ExperienceGraphData | None
    error: ApiError | None


class ExperienceDetailResponse(BaseModel):
    success: bool
    data: ExperienceCase | None
    error: ApiError | None


class AnonymizePreviewRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4_000)


class AnonymizePreviewData(BaseModel):
    original_is_stored: bool = False
    anonymized_text: str
    transformations: list[str]
    safe_to_preview: bool
    notice: str


class AnonymizePreviewResponse(BaseModel):
    success: bool
    data: AnonymizePreviewData | None
    error: ApiError | None
