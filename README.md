# websearch

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