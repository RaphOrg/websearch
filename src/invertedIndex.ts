import type { DocId } from './types.js'

export type Posting = {
  docId: DocId
  tf: number
  positions: number[]
}

export class InvertedIndex {
  // term -> docId -> posting
  private termDocs = new Map<string, Map<DocId, Posting>>()
  private frozen = false

  addDocument(docId: DocId, tokens: string[]): void {
    if (this.frozen) throw new Error('InvertedIndex is finalized; cannot addDocument')
    const posMap = new Map<string, number[]>()
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      if (!t) continue
      let arr = posMap.get(t)
      if (!arr) {
        arr = []
        posMap.set(t, arr)
      }
      arr.push(i)
    }

    for (const [term, positions] of posMap) {
      let docs = this.termDocs.get(term)
      if (!docs) {
        docs = new Map()
        this.termDocs.set(term, docs)
      }
      docs.set(docId, { docId, tf: positions.length, positions })
    }
  }

  finalize(): void {
    this.frozen = true
  }

  postings(term: string): Posting[] {
    const docs = this.termDocs.get(term)
    if (!docs) return []
    return [...docs.values()]
  }

  searchTokens(tokens: string[]): Map<string, Posting[]> {
    const out = new Map<string, Posting[]>()
    for (const t of tokens) out.set(t, this.postings(t))
    return out
  }

  docFreq(term: string): number {
    return this.termDocs.get(term)?.size ?? 0
  }

  terms(): Iterable<string> {
    return this.termDocs.keys()
  }
}

