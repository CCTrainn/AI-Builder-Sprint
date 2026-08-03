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
            WHERE workplace_id = ? AND status = 'open'
            ORDER BY created_at DESC LIMIT 1
            """,
            (workplace_id,),
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


async def update_message(
    message_id: str,
    workplace_id: str,
    original_text: str,
    *,
    translated_text: str | None = None,
    analysis_json: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    def operation(connection: sqlite3.Connection) -> dict[str, Any] | None:
        row = connection.execute(
            """
            SELECT m.id, m.analysis_json FROM messages AS m
            JOIN conversations AS c ON c.id = m.conversation_id
            WHERE m.id = ? AND c.workplace_id = ?
            """,
            (message_id, workplace_id),
        ).fetchone()
        if row is None:
            return None
        connection.execute(
            """
            UPDATE messages
            SET original_text = ?, translated_text = ?, analysis_json = ?
            WHERE id = ?
            """,
            (
                original_text,
                translated_text,
                json.dumps(
                    analysis_json
                    if analysis_json is not None
                    else json.loads(row["analysis_json"] or "{}"),
                    ensure_ascii=False,
                ),
                message_id,
            ),
        )
        updated = connection.execute("SELECT * FROM messages WHERE id = ?", (message_id,)).fetchone()
        result = dict(updated)
        result["analysis_json"] = json.loads(result["analysis_json"] or "{}")
        return result

    return await _call(operation, "대화 메시지를 수정하지 못했습니다.")


async def delete_message(message_id: str, workplace_id: str) -> bool:
    def operation(connection: sqlite3.Connection) -> bool:
        cursor = connection.execute(
            """
            DELETE FROM messages WHERE id = ? AND conversation_id IN (
                SELECT id FROM conversations WHERE workplace_id = ?
            )
            """,
            (message_id, workplace_id),
        )
        return cursor.rowcount > 0

    return await _call(operation, "대화 메시지를 삭제하지 못했습니다.")


async def clear_conversation_messages(conversation_id: str, workplace_id: str) -> bool:
    """검증된 현재 대화방의 메시지만 비워 AI 맥락을 초기화한다."""

    def operation(connection: sqlite3.Connection) -> bool:
        conversation = connection.execute(
            "SELECT id FROM conversations WHERE id = ? AND workplace_id = ?",
            (conversation_id, workplace_id),
        ).fetchone()
        if conversation is None:
            return False
        connection.execute(
            "DELETE FROM messages WHERE conversation_id = ?",
            (conversation_id,),
        )
        return True

    return await _call(operation, "현재 대화 기록을 전체 삭제하지 못했습니다.")


async def save_conversation_resolution(
    reply_id: str,
    workplace_id: str,
    comparison_id: str,
    outcome: str,
) -> dict[str, Any] | None:
    """사용자가 확인한 결과를 최신 고용주 답변에 기록한다."""

    def operation(connection: sqlite3.Connection) -> dict[str, Any] | None:
        row = connection.execute(
            """
            SELECT m.analysis_json, m.conversation_id
            FROM messages AS m
            JOIN conversations AS c ON c.id = m.conversation_id
            WHERE m.id = ? AND m.sender = 'employer'
              AND c.workplace_id = ?
            """,
            (reply_id, workplace_id),
        ).fetchone()
        if row is None:
            return None
        analysis = json.loads(row["analysis_json"] or "{}")
        if analysis.get("comparison_id") != comparison_id:
            return None
        analysis["user_resolution"] = outcome
        connection.execute(
            "UPDATE messages SET analysis_json = ? WHERE id = ?",
            (json.dumps(analysis, ensure_ascii=False), reply_id),
        )
        if outcome in {"resolved", "partially_resolved"}:
            connection.execute(
                "UPDATE conversations SET status = 'closed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
                (row["conversation_id"],),
            )
        return {"conversation_id": row["conversation_id"], "outcome": outcome}

    return await _call(operation, "사용자 해결 확인 결과를 저장하지 못했습니다.")


async def find_latest_workplace_resolution(workplace_id: str) -> dict[str, Any] | None:
    def operation(connection: sqlite3.Connection) -> dict[str, Any] | None:
        rows = connection.execute(
            """
            SELECT m.analysis_json
            FROM messages AS m
            JOIN conversations AS c ON c.id = m.conversation_id
            WHERE c.workplace_id = ? AND m.sender = 'employer'
            ORDER BY m.created_at DESC, m.rowid DESC
            """,
            (workplace_id,),
        ).fetchall()
        for row in rows:
            analysis = json.loads(row["analysis_json"] or "{}")
            outcome = analysis.get("user_resolution")
            if outcome in {"resolved", "partially_resolved", "unresolved"}:
                return {"comparison_id": analysis.get("comparison_id"), "outcome": outcome}
        return None

    return await _call(operation, "최근 해결 확인 결과를 조회하지 못했습니다.")


async def find_open_conversation(
    workplace_id: str,
    comparison_id: str,
) -> dict[str, Any] | None:
    def operation(connection: sqlite3.Connection) -> dict[str, Any] | None:
        row = connection.execute(
            """
            SELECT * FROM conversations
            WHERE workplace_id = ? AND status = 'open'
            ORDER BY created_at DESC LIMIT 1
            """,
            (workplace_id,),
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


async def list_workplace_messages(workplace_id: str) -> list[dict[str, Any]]:
    """Return one chronological Kakao-like timeline across all workplace issues."""

    def operation(connection: sqlite3.Connection) -> list[dict[str, Any]]:
        rows = connection.execute(
            """
            SELECT m.id, m.sender, m.original_text, m.translated_text,
                   m.analysis_json, m.created_at
            FROM messages AS m
            JOIN conversations AS c ON c.id = m.conversation_id
            WHERE c.workplace_id = ?
            ORDER BY m.created_at ASC, m.rowid ASC
            """,
            (workplace_id,),
        ).fetchall()
        result = []
        for row in rows:
            item = dict(row)
            item["analysis_json"] = json.loads(item["analysis_json"] or "{}")
            if item["sender"] == "assistant" and item["analysis_json"].get(
                "message_type"
            ) not in {"sent", "greeting"}:
                continue
            result.append(item)
        return result

    return await _call(operation, "사업장 대화 기록을 로컬 DB에서 조회하지 못했습니다.")
