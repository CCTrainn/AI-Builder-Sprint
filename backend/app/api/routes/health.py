"""FastAPI 서버 상태 확인 API."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, object]:
    return {
        "success": True,
        "data": {
            "status": "ok",
        },
        "error": None,
    }
