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

index.finalize()

const hits = index.search('apple', { k: 5 })
// => [{ id: '1', score: ... }]

const suggestions = index.suggest('ap', { k: 5 })
// => ['apple', ...]
```

### Adapter expectations (DB → core)

When we swap to DB-backed storage, the adapter just needs to provide:

- Postings shaped like: `postings(term, docId, tf, positions:int[])` (positions are 0-based in the emitted token stream)
- Corpus stats: total doc count `N` and `dfByTerm[term]` (doc frequency per term)
- Per-doc stats for scoring: `docLen` (token count) and optionally `tfByTerm` if you pre-aggregate

### Assumptions

- Tokenization: lowercase, split on non `[a-z0-9]`.
- Scoring: `tf = 1 + log(count)`, `idf = log(1 + (N+1)/(df+1))`, cosine normalization.
- Candidate generation: union of postings for query terms.

### Benchmark

```bash
DOCS=50000 VOCAB=5000 LEN=40 npm run bench:dev
```
