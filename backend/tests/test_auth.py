from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import auth
from app.core.config import get_settings
from app.db.session import reset_initialization_state


def test_local_signup_and_login(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setenv("LOCAL_DATA_DIR", str(tmp_path))
    get_settings.cache_clear()
    reset_initialization_state()
    app = FastAPI()
    app.include_router(auth.router, prefix="/auth")
    client = TestClient(app)
    try:
        signup = client.post(
            "/auth/signup",
            json={"email": "worker@example.com", "password": "safe-password"},
        )
        assert signup.status_code == 201
        assert signup.json()["data"]["email"] == "worker@example.com"

        login = client.post(
            "/auth/login",
            json={"email": "worker@example.com", "password": "safe-password"},
        )
        assert login.status_code == 200
        assert login.json()["data"]["token"]

        rejected = client.post(
            "/auth/login",
            json={"email": "worker@example.com", "password": "wrong-password"},
        )
        assert rejected.status_code == 401
    finally:
        get_settings.cache_clear()
        reset_initialization_state()
