import { InvertedIndex } from './invertedIndex.js'
import { Trie } from './trie.js'
import { tokenize } from './tokenize.js'
import type { DocumentInput, SearchHit, SearchOptions, SuggestOptions } from './types.js'
import { topK } from './minHeap.js'
import { tfidfCosineScore, type CorpusStats, type DocTermStats } from './tfidf.js'

type StoredDoc = {
  id: string
  title: string
  body: string
  tokens: string[]
  termStats: DocTermStats
}

export class SearchIndex {
  private inv = new InvertedIndex()
  private trie = new Trie()
  private docs = new Map<string, StoredDoc>()
  private corpus: CorpusStats = { docCount: 0, df: new Map() }
  private finalized = false

  addDocument(doc: DocumentInput): void {
    if (this.finalized) throw new Error('SearchIndex is finalized; cannot addDocument')
    const title = doc.title ?? ''
    const body = doc.body ?? ''
    const tokens = tokenize(`${title} ${body}`)
    const tf = new Map<string, number>()
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)

    // update corpus df (once per term per doc)
    for (const term of tf.keys()) {
      this.corpus.df.set(term, (this.corpus.df.get(term) ?? 0) + 1)
      this.trie.insert(term)
    }
    this.corpus.docCount += 1

    const termStats: DocTermStats = { docLen: tokens.length, tf }
    const stored: StoredDoc = { id: doc.id, title, body, tokens, termStats }
    this.docs.set(doc.id, stored)
    this.inv.addDocument(doc.id, tokens)
  }

  finalize(): void {
    this.finalized = true
    this.inv.finalize()
  }

  search(query: string, opts: SearchOptions = {}): SearchHit[] {
    const k = opts.k ?? 10
    const qTokens = tokenize(query)
    if (qTokens.length === 0) return []

    // candidate set = union of postings for query terms
    const candidates = new Set<string>()
    for (const t of qTokens) {
      for (const p of this.inv.postings(t)) candidates.add(p.docId)
    }

    const scored = topK(
      candidates,
      k,
      (docId) => tfidfCosineScore(qTokens, this.docs.get(docId)!.termStats, this.corpus),
    )

    return scored
      .map((id) => ({ id, score: tfidfCosineScore(qTokens, this.docs.get(id)!.termStats, this.corpus) }))
      .sort((a, b) => b.score - a.score)
  }

  suggest(prefix: string, opts: SuggestOptions = {}): string[] {
    const k = opts.k ?? 10
    const pref = prefix.toLowerCase()
    return this.trie.prefix(pref, k)
  }
}

