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

## Search (DB-backed)

End-to-end smoke:

```bash
npm run db:init
npm run gen -- ./data/documents.jsonl 50000
INGEST_PATH=./data/documents.jsonl npm run ingest

# query + k
npm run search -- "foo" --k 10
```

Expected: should return results quickly (target <50ms for warm query on local docker).

## Core Structures & Ranking

In-memory search core (no DB):

- `InvertedIndex`: term → postings (docId, tf, positions)
- `Trie`: prefix autocomplete for terms
- `TF‑IDF` cosine-ish scorer (log tf, smoothed idf)
- `topK`: min-heap selection for top N scored docs

### Usage

```ts
import { SearchIndex } from './src/searchIndex.js'

const index = new SearchIndex()

index.addDocument({ id: '1', title: 'Apple pie', body: 'tasty apple apple' })
index.addDocument({ id: '2', title: 'Carrot cake', body: 'tasty carrot carrot' })

// optional: lock index for writes (helps enforce immutability when integrating storage)
index.finalize()

const hits = index.search('apple', { k: 5 })
// => [{ id: '1', score: ... }]

const suggestions = index.suggest('ap', { k: 5 })
// => ['apple', ...]
```

### Assumptions

- Tokenization: lowercase, split on non `[a-z0-9]`.
- Scoring: `tf = 1 + log(count)`, `idf = log(1 + (N+1)/(df+1))`, cosine normalization.
- Candidate generation: union of postings for query terms.

### Benchmark

```bash
DOCS=50000 VOCAB=5000 LEN=40 npm run bench:dev
```

