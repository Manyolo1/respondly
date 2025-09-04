CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY,
    from_addr TEXT NOT NULL,
    to_addr TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'QUEUED',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS processing_runs (
    id UUID PRIMARY KEY,
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    category TEXT,
    draft TEXT,
    final_response TEXT,
    verifier_notes TEXT,
    result TEXT,
    latency_ms INT,
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);
