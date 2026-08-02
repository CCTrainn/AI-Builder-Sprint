"""공동 경험 유사도 서비스 공개 진입점."""

from app.schemas.community import ExperienceMatchData, ExperienceMatchRequest
from app.services.community_service import match_experiences


def find_similar_experiences(request: ExperienceMatchRequest) -> ExperienceMatchData:
    return match_experiences(request)
