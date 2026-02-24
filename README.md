# websearch

## Local dev

### Postgres (docker)

```bash
cp .env.example .env
docker compose up -d
```

Schema is in `scripts/sql/001_init.sql` and is loaded automatically on first container init.

### Node tooling

```bash
npm i
```

## Ingest

Ingest expects JSONL by default (one JSON object per line) with fields:

```json
{"external_id":"abc","title":"...","body":"...","meta":{},"created_at":"2026-02-24T00:00:00Z"}
```

Run:

```bash
npm run db:init
INGEST_PATH=./data/documents.jsonl npm run ingest
```

The ingest pipeline can also index into `terms`/`postings` (currently enabled for `ingest` + `bench`).

## Bench

```bash
INGEST_PATH=./data/documents.jsonl npm run bench
```

Outputs `index_time_ms` and `sample_query_ms`.