import { withClient } from '../db.js'
import { score } from '../score.js'
import { tokenize } from '../tokenize.js'
import type { CorpusStats, DocTermStats } from '../tfidf.js'
import type { DocId, SearchHit } from '../types.js'

export type DbSearchOptions = {
  k?: number
}

export type DbSearchHit = SearchHit & {
  externalId?: string
  title?: string
}

type PostingRow = {
  term: string
  doc_id: string | number
  tf: number
}

// DB-backed search adapter that feeds Quill's score() with DocTermStats + corpus stats.
export async function searchDb(query: string, opts: DbSearchOptions = {}): Promise<DbSearchHit[]> {
  const qTokens = tokenize(query)
  const uniqTerms = Array.from(new Set(qTokens)).filter(Boolean)
  if (uniqTerms.length === 0) return []

  return await withClient(async (c) => {
    // N = number of docs
    const nRes = await c.query<{ n: string }>('select count(*)::bigint as n from documents')
    const N = Number(nRes.rows[0]?.n ?? 0)

    // df for query terms only (keeps it cheap)
    const dfRes = await c.query<{ term: string; df: string }>(
      `select term, count(*)::bigint as df
       from postings
       where term = any($1)
       group by term`,
      [uniqTerms],
    )
    const dfByTerm = new Map<string, number>()
    for (const r of dfRes.rows) dfByTerm.set(r.term, Number(r.df))

    // postings for query terms -> doc stats
    const pRes = await c.query<PostingRow>(
      `select term, doc_id, tf
       from postings
       where term = any($1)`,
      [uniqTerms],
    )

    const docs = new Map<DocId, DocTermStats>()
    for (const row of pRes.rows) {
      const docId = String(row.doc_id)
      let s = docs.get(docId)
      if (!s) {
        s = { tf: new Map<string, number>(), docLen: 0 }
        docs.set(docId, s)
      }
      s.tf.set(row.term, row.tf)
      s.docLen += row.tf
    }

    const corpus: CorpusStats = { docCount: N, df: dfByTerm }
    const hits = score(qTokens, docs, corpus, { k: opts.k })

    // hydrate external_id/title for printing
    const ids = hits.map((h) => Number(h.id)).filter((x) => Number.isFinite(x))
    if (ids.length === 0) return hits
    const metaRes = await c.query<{ id: number; external_id: string; title: string }>(
      `select id, external_id, title
       from documents
       where id = any($1)`,
      [ids],
    )
    const metaById = new Map<string, { externalId?: string; title?: string }>()
    for (const r of metaRes.rows) metaById.set(String(r.id), { externalId: r.external_id, title: r.title })

    return hits.map((h) => ({ ...h, ...metaById.get(h.id) }))
  })
}

