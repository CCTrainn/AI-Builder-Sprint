"""Small local authentication API for the offline demo environment."""

import hashlib
import hmac
import secrets
import sqlite3

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.db.session import run_db

router = APIRouter()


class AuthRequest(BaseModel):
    email: str
    password: str


def _normalize_email(value: str) -> str:
    email = value.strip().lower()
    if "@" not in email or len(email) > 254:
        raise HTTPException(status_code=422, detail="올바른 이메일을 입력해 주세요.")
    return email


def _hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
    if len(password) < 4:
        raise HTTPException(status_code=422, detail="비밀번호는 4자 이상이어야 합니다.")
    actual_salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), actual_salt, 200_000)
    return actual_salt.hex(), digest.hex()


def _ensure_users_table(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS local_users (
            email TEXT PRIMARY KEY,
            password_salt TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: AuthRequest) -> dict:
    email = _normalize_email(request.email)
    salt, password_hash = _hash_password(request.password)

    def operation(connection: sqlite3.Connection) -> None:
        _ensure_users_table(connection)
        try:
            connection.execute(
                "INSERT INTO local_users (email, password_salt, password_hash) VALUES (?, ?, ?)",
                (email, salt, password_hash),
            )
        except sqlite3.IntegrityError as error:
            raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다.") from error

    await run_db(operation)
    return {"success": True, "data": {"email": email}, "error": None}


@router.post("/login")
async def login(request: AuthRequest) -> dict:
    email = _normalize_email(request.email)

    def operation(connection: sqlite3.Connection) -> sqlite3.Row | None:
        _ensure_users_table(connection)
        return connection.execute(
            "SELECT email, password_salt, password_hash FROM local_users WHERE email = ?",
            (email,),
        ).fetchone()

    user = await run_db(operation)
    if user is None:
        raise HTTPException(status_code=401, detail="이메일이나 비밀번호를 확인해 주세요.")
    _, supplied_hash = _hash_password(request.password, bytes.fromhex(user["password_salt"]))
    if not hmac.compare_digest(supplied_hash, user["password_hash"]):
        raise HTTPException(status_code=401, detail="이메일이나 비밀번호를 확인해 주세요.")

    return {
        "success": True,
        "data": {"token": secrets.token_urlsafe(32), "email": user["email"]},
        "error": None,
    }
