-- TwinCloud Ops PostgreSQL Schema Initialization

CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    target_node VARCHAR(64) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_seconds DOUBLE PRECISION,
    status VARCHAR(32) NOT NULL,
    details TEXT
);

CREATE INDEX IF NOT EXISTS idx_incidents_start_time ON incidents (start_time DESC);

CREATE TABLE IF NOT EXISTS probe_metrics (
    id SERIAL PRIMARY KEY,
    node_name VARCHAR(64) NOT NULL,
    target_url VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    http_code INTEGER,
    latency_ms DOUBLE PRECISION,
    checked_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_probe_metrics_checked_at ON probe_metrics (checked_at DESC);
