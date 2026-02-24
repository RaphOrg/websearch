-- Schema for documents + inverted index storage.
-- Loaded automatically by docker-compose via /docker-entrypoint-initdb.d.

CREATE TABLE IF NOT EXISTS documents (
  id          BIGSERIAL PRIMARY KEY,
  external_id TEXT UNIQUE,
  title       TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL DEFAULT '',
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS terms (
  term TEXT PRIMARY KEY
);

-- postings: one row per (term, doc). positions are token offsets in the doc.
CREATE TABLE IF NOT EXISTS postings (
  term      TEXT NOT NULL REFERENCES terms(term) ON DELETE CASCADE,
  doc_id    BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tf        INT NOT NULL,
  positions INT[] NOT NULL,
  PRIMARY KEY(term, doc_id)
);

CREATE INDEX IF NOT EXISTS idx_postings_doc_id ON postings(doc_id);

