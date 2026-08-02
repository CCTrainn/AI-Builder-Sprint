"""SQLite persistence for work records, comparisons, and law cache."""

import json
import sqlite3
from collections.abc import Callable
from typing import Any, TypeVar
from uuid import uuid4

from app.db.session import run_db

T = TypeVar("T")


class RecordDatabaseError(RuntimeError):
    """A local records database operation failed."""


async def _call(operation: Callable[[sqlite3.Connection], T], message: str) -> T:
    try:
        return await run_db(operation)
    except sqlite3.Error as exc:
        raise RecordDatabaseError(message) from exc


def _dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(row) if row is not None else None


async def insert_record(record: dict[str, Any]) -> dict[str, Any]:
    columns = (
        "id", "workplace_id", "record_type", "storage_path", "original_file_name",
        "original_text", "recorded_at", "processing_status",
    )

    def operation(connection: sqlite3.Connection) -> dict[str, Any]:
        connection.execute(
            f"INSERT INTO records ({','.join(columns)}) VALUES ({','.join('?' for _ in columns)})",
            tuple(record.get(column) for column in columns),
        )
        row = connection.execute("SELECT * FROM records WHERE id = ?", (record["id"],)).fetchone()
        return dict(row)

    return await _call(operation, "근로자료를 로컬 DB에 저장하지 못했습니다.")


async def find_record(record_id: str) -> dict[str, Any] | None:
    return await _call(
        lambda connection: _dict(
            connection.execute("SELECT * FROM records WHERE id = ?", (record_id,)).fetchone()
        ),
        "근로자료를 로컬 DB에서 조회하지 못했습니다.",
    )


async def list_workplace_records(workplace_id: str) -> list[dict[str, Any]]:
    def operation(connection: sqlite3.Connection) -> list[dict[str, Any]]:
        rows = connection.execute(
            """
            SELECT r.id, r.record_type, r.original_file_name, r.recorded_at,
                   r.processing_status, r.created_at, COUNT(c.id) AS condition_count
            FROM records AS r
            LEFT JOIN extracted_conditions AS c ON c.record_id = r.id
            WHERE r.workplace_id = ?
            GROUP BY r.id
            ORDER BY r.recorded_at DESC, r.created_at DESC
            """,
            (workplace_id,),
        ).fetchall()
        return [dict(row) for row in rows]

    return await _call(operation, "근로자료 목록을 로컬 DB에서 조회하지 못했습니다.")


async def delete_record(record_id: str) -> None:
    def operation(connection: sqlite3.Connection) -> None:
        connection.execute("DELETE FROM records WHERE id = ?", (record_id,))

    await _call(operation, "근로자료를 로컬 DB에서 삭제하지 못했습니다.")


async def update_record_processing(
    record_id: str,
    *,
    processing_status: str,
    original_text: str | None = None,
) -> None:
    def operation(connection: sqlite3.Connection) -> None:
        if original_text is None:
            connection.execute(
                "UPDATE records SET processing_status = ? WHERE id = ?",
                (processing_status, record_id),
            )
        else:
            connection.execute(
                "UPDATE records SET processing_status = ?, original_text = ? WHERE id = ?",
                (processing_status, original_text, record_id),
            )

    await _call(operation, "근로자료 처리 상태를 로컬 DB에 저장하지 못했습니다.")


async def replace_extracted_conditions(
    record_id: str,
    conditions: list[dict[str, Any]],
) -> None:
    def operation(connection: sqlite3.Connection) -> None:
        connection.execute("DELETE FROM extracted_conditions WHERE record_id = ?", (record_id,))
        connection.executemany(
            """
            INSERT INTO extracted_conditions (
                id, record_id, condition_type, value_text, value_number,
                unit, confidence, source_text
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    f"cond_{uuid4().hex}", record_id, item["condition_type"],
                    item.get("value_text"), item.get("value_number"), item.get("unit"),
                    item.get("confidence"), item.get("source_text"),
                )
                for item in conditions
            ],
        )

    await _call(operation, "추출 조건을 로컬 DB에 저장하지 못했습니다.")


async def find_extracted_conditions(record_id: str) -> list[dict[str, Any]]:
    def operation(connection: sqlite3.Connection) -> list[dict[str, Any]]:
        rows = connection.execute(
            """
            SELECT condition_type, value_text, value_number, unit, confidence, source_text
            FROM extracted_conditions WHERE record_id = ? ORDER BY rowid
            """,
            (record_id,),
        ).fetchall()
        return [dict(row) for row in rows]

    return await _call(operation, "추출 조건을 로컬 DB에서 조회하지 못했습니다.")


async def find_workplace_condition_rows(workplace_id: str) -> list[dict[str, Any]]:
    def operation(connection: sqlite3.Connection) -> list[dict[str, Any]]:
        rows = connection.execute(
            """
            SELECT c.record_id, c.condition_type, c.value_text, c.value_number,
                   c.unit, c.confidence, c.source_text,
                   r.id, r.record_type, r.recorded_at
            FROM records AS r
            JOIN extracted_conditions AS c ON c.record_id = r.id
            WHERE r.workplace_id = ? AND r.processing_status = 'completed'
            """,
            (workplace_id,),
        ).fetchall()
        return [dict(row) for row in rows]

    return await _call(operation, "비교할 근로조건을 로컬 DB에서 조회하지 못했습니다.")


async def save_comparisons(
    workplace_id: str,
    comparison_rows: list[dict[str, Any]],
) -> dict[str, str]:
    def operation(connection: sqlite3.Connection) -> dict[str, str]:
        existing = {
            row["condition_type"]: row["id"]
            for row in connection.execute(
                "SELECT id, condition_type FROM comparisons WHERE workplace_id = ?",
                (workplace_id,),
            ).fetchall()
        }
        saved: dict[str, str] = {}
        for item in comparison_rows:
            condition_type = item["condition_type"]
            comparison_id = existing.get(condition_type, item["id"])
            connection.execute(
                """
                INSERT INTO comparisons (
                    id, workplace_id, condition_type, promised_record_id,
                    contracted_record_id, actual_record_id, status, summary,
                    confirmation_items, legal_reference
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(workplace_id, condition_type) DO UPDATE SET
                    promised_record_id = excluded.promised_record_id,
                    contracted_record_id = excluded.contracted_record_id,
                    actual_record_id = excluded.actual_record_id,
                    status = excluded.status,
                    summary = excluded.summary,
                    confirmation_items = excluded.confirmation_items,
                    legal_reference = excluded.legal_reference,
                    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
                """,
                (
                    comparison_id, workplace_id, condition_type,
                    item.get("promised_record_id"), item.get("contracted_record_id"),
                    item.get("actual_record_id"), item["status"], item["summary"],
                    json.dumps(item.get("confirmation_items") or [], ensure_ascii=False),
                    json.dumps(item.get("legal_reference") or {}, ensure_ascii=False),
                ),
            )
            saved[condition_type] = comparison_id

        current_types = set(saved)
        for condition_type in set(existing) - current_types:
            connection.execute(
                "DELETE FROM comparisons WHERE workplace_id = ? AND condition_type = ?",
                (workplace_id, condition_type),
            )
        return saved

    return await _call(operation, "비교 결과를 로컬 DB에 저장하지 못했습니다.")


async def find_comparison_detail(comparison_id: str) -> dict[str, Any] | None:
    aliases = {"pay_date": ("pay_date", "deposit_date"), "net_pay": ("net_pay", "deposit_amount")}

    def operation(connection: sqlite3.Connection) -> dict[str, Any] | None:
        row = connection.execute(
            "SELECT * FROM comparisons WHERE id = ?", (comparison_id,)
        ).fetchone()
        if row is None:
            return None
        comparison = dict(row)
        comparison["confirmation_items"] = json.loads(comparison["confirmation_items"] or "[]")
        comparison["legal_reference"] = json.loads(comparison["legal_reference"] or "{}")
        role_record_ids = {
            "promised": comparison.get("promised_record_id"),
            "contracted": comparison.get("contracted_record_id"),
            "actual": comparison.get("actual_record_id"),
        }
        condition_types = aliases.get(
            comparison["condition_type"], (comparison["condition_type"],)
        )
        placeholders = ",".join("?" for _ in condition_types)
        values: dict[str, dict[str, Any]] = {}
        for role, record_id in role_record_ids.items():
            if not record_id:
                continue
            condition = connection.execute(
                f"""
                SELECT value_text, value_number, unit FROM extracted_conditions
                WHERE record_id = ? AND condition_type IN ({placeholders}) LIMIT 1
                """,
                (record_id, *condition_types),
            ).fetchone()
            if condition is None:
                continue
            value = condition["value_number"]
            if value is None:
                value = condition["value_text"]
            values[role] = {"value": value, "unit": condition["unit"], "record_id": record_id}
        comparison["values"] = values
        return comparison

    return await _call(operation, "비교 상세 정보를 로컬 DB에서 조회하지 못했습니다.")


async def find_cached_law_reference(
    law_name: str,
    article_number: int,
) -> dict[str, Any] | None:
    return await _call(
        lambda connection: _dict(
            connection.execute(
                "SELECT * FROM legal_references WHERE law_name = ? AND article_number = ?",
                (law_name, article_number),
            ).fetchone()
        ),
        "법령 캐시를 로컬 DB에서 조회하지 못했습니다.",
    )


async def upsert_law_reference(reference: dict[str, Any]) -> None:
    def operation(connection: sqlite3.Connection) -> None:
        connection.execute(
            """
            INSERT INTO legal_references (
                topic, law_name, article_number, article_title, article_text, source_url
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(law_name, article_number) DO UPDATE SET
                topic = excluded.topic,
                article_title = excluded.article_title,
                article_text = excluded.article_text,
                source_url = excluded.source_url,
                fetched_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            """,
            (
                reference["topic"], reference["law_name"], reference["article_number"],
                reference.get("article_title"), reference.get("article_text"),
                reference.get("source_url"),
            ),
        )

    await _call(operation, "법령 캐시를 로컬 DB에 저장하지 못했습니다.")
