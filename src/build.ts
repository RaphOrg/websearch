import type { DocId } from './types.js'
import { InvertedIndex, type Posting } from './invertedIndex.js'

export type TokensByDoc = Map<DocId, string[]>

// Convenience builder for integration: deterministic term -> postings map.
export function buildInvertedIndex(tokensByDoc: TokensByDoc): Map<string, Posting[]> {
  const idx = new InvertedIndex()
  for (const [docId, tokens] of tokensByDoc) idx.addDocument(docId, tokens)
  idx.finalize()
  const out = new Map<string, Posting[]>()
  for (const term of idx.terms()) out.set(term, idx.postings(term))
  return out
}

