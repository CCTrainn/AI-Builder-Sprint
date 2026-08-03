from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import get_settings

settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0")
app.include_router(api_router, prefix="/api/v1")

# Keep the HTML/CSS/JS demo on the same origin as the API.  This lets the
# frontend call /api/v1 without exposing Supabase keys or requiring CORS in
# the local demo environment.
frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
