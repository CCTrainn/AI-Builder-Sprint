"""Short-lived SQLite connections shared by the local repositories."""

import asyncio
import sqlite3
from collections.abc import Callable
from pathlib import Path
from threading import Lock
from typing import TypeVar

from app.core.config import get_settings
from app.db.models import SCHEMA_SQL

T = TypeVar("T")
_schema_lock = Lock()
_initialized_paths: set[Path] = set()


def database_path() -> Path:
    settings = get_settings()
    return settings.local_data_dir / settings.local_db_name


def _connect() -> sqlite3.Connection:
    path = database_path().resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=5.0)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 5000")
    connection.execute("PRAGMA journal_mode = WAL")
    return connection


def _ensure_schema() -> None:
    path = database_path().resolve()
    if path in _initialized_paths:
        return
    with _schema_lock:
        if path in _initialized_paths:
            return
        connection = _connect()
        try:
            connection.executescript(SCHEMA_SQL)
            connection.commit()
        finally:
            connection.close()
        _initialized_paths.add(path)


def _run(operation: Callable[[sqlite3.Connection], T]) -> T:
    _ensure_schema()
    connection = _connect()
    try:
        with connection:
            return operation(connection)
    finally:
        connection.close()


async def run_db(operation: Callable[[sqlite3.Connection], T]) -> T:
    """Run blocking SQLite work outside FastAPI's event-loop thread."""

    return await asyncio.to_thread(_run, operation)


def reset_initialization_state() -> None:
    """Let tests initialize a newly configured temporary database."""

    with _schema_lock:
        _initialized_paths.clear()
