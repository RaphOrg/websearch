import { topK } from './minHeap.js'
import { tfidfCosineScore, type CorpusStats, type DocTermStats } from './tfidf.js'
import type { DocId, SearchHit } from './types.js'

export type ScoreOptions = { k?: number }

// Integration-friendly scorer: given query tokens and per-doc stats, returns topK.
export function score(
  queryTokens: string[],
  docs: Map<DocId, DocTermStats>,
  corpus: CorpusStats,
  opts: ScoreOptions = {},
): SearchHit[] {
  const k = opts.k ?? 10
  const candidates = docs.keys()
  const top = topK(candidates, k, (docId) => tfidfCosineScore(queryTokens, docs.get(docId)!, corpus))
  return top
    .map((id) => ({ id, score: tfidfCosineScore(queryTokens, docs.get(id)!, corpus) }))
    .sort((a, b) => b.score - a.score)
}

