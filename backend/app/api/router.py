from fastapi import APIRouter

from app.api.routes import comparisons, conversations, health, records

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(records.router, prefix="/records", tags=["records"])
api_router.include_router(comparisons.router, prefix="/workplaces", tags=["comparisons"])
api_router.include_router(
    comparisons.detail_router,
    prefix="/comparisons",
    tags=["comparisons"],
)
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
