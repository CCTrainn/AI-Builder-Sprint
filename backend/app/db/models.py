"""SQLite schema for the self-contained hackathon demo."""

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    workplace_id TEXT NOT NULL,
    record_type TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    original_file_name TEXT NOT NULL,
    original_text TEXT,
    recorded_at TEXT NOT NULL,
    processing_status TEXT NOT NULL DEFAULT 'uploaded'
        CHECK (processing_status IN ('uploaded', 'processing', 'completed', 'failed')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS records_workplace_id_idx
    ON records (workplace_id, recorded_at DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS extracted_conditions (
    id TEXT PRIMARY KEY,
    record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    condition_type TEXT NOT NULL,
    value_text TEXT,
    value_number REAL,
    unit TEXT,
    confidence REAL,
    source_text TEXT
);

CREATE INDEX IF NOT EXISTS extracted_conditions_record_id_idx
    ON extracted_conditions (record_id);

CREATE TABLE IF NOT EXISTS comparisons (
    id TEXT PRIMARY KEY,
    workplace_id TEXT NOT NULL,
    condition_type TEXT NOT NULL,
    promised_record_id TEXT REFERENCES records(id) ON DELETE SET NULL,
    contracted_record_id TEXT REFERENCES records(id) ON DELETE SET NULL,
    actual_record_id TEXT REFERENCES records(id) ON DELETE SET NULL,
    status TEXT NOT NULL,
    summary TEXT NOT NULL,
    confirmation_items TEXT NOT NULL DEFAULT '[]',
    legal_reference TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (workplace_id, condition_type)
);

CREATE INDEX IF NOT EXISTS comparisons_workplace_id_idx
    ON comparisons (workplace_id);

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    workplace_id TEXT NOT NULL,
    comparison_id TEXT NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS conversations_workplace_comparison_idx
    ON conversations (workplace_id, comparison_id, status);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('assistant', 'employer')),
    original_text TEXT NOT NULL,
    translated_text TEXT,
    analysis_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
    ON messages (conversation_id, created_at);

CREATE TABLE IF NOT EXISTS legal_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    law_name TEXT NOT NULL,
    article_number INTEGER NOT NULL,
    article_title TEXT,
    article_text TEXT,
    source_url TEXT,
    fetched_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (law_name, article_number)
);
"""
