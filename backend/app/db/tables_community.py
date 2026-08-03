"""Local persistence for user-owned anonymized experiences."""

import json
import sqlite3
from typing import Any
from uuid import uuid4

from app.db.session import run_db


def _ensure_sharing_columns(connection: sqlite3.Connection) -> None:
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(community_experiences)")}
    if "is_shared" not in columns:
        connection.execute("ALTER TABLE community_experiences ADD COLUMN is_shared INTEGER NOT NULL DEFAULT 0")
    if "shared_at" not in columns:
        connection.execute("ALTER TABLE community_experiences ADD COLUMN shared_at TEXT")


async def create_user_experience(data: dict[str, Any]) -> dict[str, Any]:
    experience_id = f"user_exp_{uuid4().hex}"

    def operation(connection: sqlite3.Connection) -> dict[str, Any]:
        _ensure_sharing_columns(connection)
        existing = connection.execute(
            """SELECT id FROM community_experiences
            WHERE workplace_id = ? ORDER BY is_shared DESC, created_at DESC LIMIT 1""",
            (data["workplace_id"],),
        ).fetchone()
        target_id = existing["id"] if existing else experience_id
        values = (
            data["problem_type"],
            data["outcome"],
            data["anonymized_text"],
            json.dumps(data.get("evidence_types", []), ensure_ascii=False),
        )
        if existing:
            connection.execute(
                """
                UPDATE community_experiences
                SET problem_type = ?, outcome = ?, anonymized_text = ?, evidence_types = ?,
                    consented_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
                    is_shared = 0, shared_at = NULL
                WHERE id = ?
                """,
                (*values, target_id),
            )
        else:
            connection.execute(
                """
                INSERT INTO community_experiences (
                    id, workplace_id, problem_type, outcome, anonymized_text,
                    evidence_types, consented_at
                ) VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
                """,
                (target_id, data["workplace_id"], *values),
            )
        row = connection.execute(
            "SELECT * FROM community_experiences WHERE id = ?", (target_id,)
        ).fetchone()
        return _serialize(row)

    return await run_db(operation)


async def list_user_experiences(workplace_id: str) -> list[dict[str, Any]]:
    def operation(connection: sqlite3.Connection) -> list[dict[str, Any]]:
        _ensure_sharing_columns(connection)
        rows = connection.execute(
            """
            SELECT * FROM community_experiences
            WHERE workplace_id = ? ORDER BY is_shared DESC, created_at DESC LIMIT 1
            """,
            (workplace_id,),
        ).fetchall()
        return [_serialize(row) for row in rows]

    return await run_db(operation)


async def share_user_experience(experience_id: str, workplace_id: str) -> dict[str, Any] | None:
    def operation(connection: sqlite3.Connection) -> dict[str, Any] | None:
        _ensure_sharing_columns(connection)
        connection.execute(
            """
            UPDATE community_experiences
            SET is_shared = 0, shared_at = NULL
            WHERE workplace_id = ? AND id <> ?
            """,
            (workplace_id, experience_id),
        )
        connection.execute(
            """
            UPDATE community_experiences
            SET is_shared = 1, shared_at = COALESCE(shared_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            WHERE id = ? AND workplace_id = ?
            """,
            (experience_id, workplace_id),
        )
        row = connection.execute(
            "SELECT * FROM community_experiences WHERE id = ? AND workplace_id = ?",
            (experience_id, workplace_id),
        ).fetchone()
        return _serialize(row) if row else None

    return await run_db(operation)


def _serialize(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item["experience_id"] = item.pop("id")
    item["evidence_types"] = json.loads(item["evidence_types"] or "[]")
    item["is_shared"] = bool(item.get("is_shared", 0))
    return item
