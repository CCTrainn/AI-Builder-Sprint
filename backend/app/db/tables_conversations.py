"""SQLite persistence for confirmation conversations and messages."""

import json
import sqlite3
from collections.abc import Callable
from typing import Any, TypeVar
from uuid import uuid4

from app.db.session import run_db

T = TypeVar("T")


class ConversationDatabaseError(RuntimeError):
    """A local conversation database operation failed."""


async def _call(operation: Callable[[sqlite3.Connection], T], message: str) -> T:
    try:
        return await run_db(operation)
    except sqlite3.Error as exc:
        raise ConversationDatabaseError(message) from exc


async def get_or_create_conversation(workplace_id: str, comparison_id: str) -> dict[str, Any]:
    def operation(connection: sqlite3.Connection) -> dict[str, Any]:
        existing = connection.execute(
            """
            SELECT * FROM conversations
            WHERE workplace_id = ? AND comparison_id = ? AND status = 'open'
            ORDER BY created_at DESC LIMIT 1
            """,
            (workplace_id, comparison_id),
        ).fetchone()
        if existing is not None:
            return dict(existing)

        conversation_id = f"conv_{uuid4().hex}"
        connection.execute(
            """
            INSERT INTO conversations (id, workplace_id, comparison_id, status)
            VALUES (?, ?, ?, 'open')
            """,
            (conversation_id, workplace_id, comparison_id),
        )
        created = connection.execute(
            "SELECT * FROM conversations WHERE id = ?", (conversation_id,)
        ).fetchone()
        return dict(created)

    return await _call(operation, "대화 정보를 로컬 DB에 저장하지 못했습니다.")


async def save_message(
    conversation_id: str,
    sender: str,
    original_text: str,
    *,
    translated_text: str | None = None,
    analysis_json: dict[str, Any] | None = None,
) -> dict[str, Any]:
    message_id = f"msg_{uuid4().hex}"

    def operation(connection: sqlite3.Connection) -> dict[str, Any]:
        connection.execute(
            """
            INSERT INTO messages (
                id, conversation_id, sender, original_text, translated_text, analysis_json
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                message_id, conversation_id, sender, original_text, translated_text,
                json.dumps(analysis_json or {}, ensure_ascii=False),
            ),
        )
        row = connection.execute("SELECT * FROM messages WHERE id = ?", (message_id,)).fetchone()
        result = dict(row)
        result["analysis_json"] = json.loads(result["analysis_json"] or "{}")
        return result

    return await _call(operation, "대화 메시지를 로컬 DB에 저장하지 못했습니다.")


async def find_open_conversation(
    workplace_id: str,
    comparison_id: str,
) -> dict[str, Any] | None:
    def operation(connection: sqlite3.Connection) -> dict[str, Any] | None:
        row = connection.execute(
            """
            SELECT * FROM conversations
            WHERE workplace_id = ? AND comparison_id = ? AND status = 'open'
            ORDER BY created_at DESC LIMIT 1
            """,
            (workplace_id, comparison_id),
        ).fetchone()
        return dict(row) if row is not None else None

    return await _call(operation, "대화 정보를 로컬 DB에서 조회하지 못했습니다.")


async def find_latest_unanswered_items(conversation_id: str) -> list[str]:
    def operation(connection: sqlite3.Connection) -> list[str]:
        row = connection.execute(
            """
            SELECT analysis_json FROM messages
            WHERE conversation_id = ? AND sender = 'employer'
            ORDER BY created_at DESC, rowid DESC LIMIT 1
            """,
            (conversation_id,),
        ).fetchone()
        if row is None:
            return []
        analysis = json.loads(row["analysis_json"] or "{}")
        items = analysis.get("unanswered_items") or []
        return [str(item) for item in items if isinstance(item, str)][:10]

    return await _call(operation, "이전 답변 분석을 로컬 DB에서 조회하지 못했습니다.")


async def list_conversation_messages(conversation_id: str) -> list[dict[str, Any]]:
    def operation(connection: sqlite3.Connection) -> list[dict[str, Any]]:
        rows = connection.execute(
            """
            SELECT id, sender, original_text, translated_text, analysis_json, created_at
            FROM messages WHERE conversation_id = ?
            ORDER BY created_at ASC, rowid ASC
            """,
            (conversation_id,),
        ).fetchall()
        result = []
        for row in rows:
            item = dict(row)
            item["analysis_json"] = json.loads(item["analysis_json"] or "{}")
            result.append(item)
        return result

    return await _call(operation, "대화 기록을 로컬 DB에서 조회하지 못했습니다.")
