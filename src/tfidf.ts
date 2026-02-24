export type CorpusStats = {
  docCount: number
  // term -> document frequency
  df: Map<string, number>
}

export type DocTermStats = {
  docLen: number
  tf: Map<string, number>
}

export function idf(term: string, corpus: CorpusStats): number {
  const df = corpus.df.get(term) ?? 0
  // classic smoothing to avoid div-by-zero; keeps idf(unknown) small but non-negative
  return Math.log(1 + (corpus.docCount + 1) / (df + 1))
}

function tfWeight(tf: number): number {
  if (tf <= 0) return 0
  return 1 + Math.log(tf)
}

// cosine-ish: dot(q, d) / (||q|| * ||d||)
export function tfidfCosineScore(queryTerms: string[], doc: DocTermStats, corpus: CorpusStats): number {
  if (queryTerms.length === 0) return 0

  const qtf = new Map<string, number>()
  for (const t of queryTerms) qtf.set(t, (qtf.get(t) ?? 0) + 1)

  let dot = 0
  let qnorm2 = 0
  let dnorm2 = 0

  // build q norm & dot
  for (const [term, qCount] of qtf) {
    const wq = tfWeight(qCount) * idf(term, corpus)
    qnorm2 += wq * wq
    const dtf = doc.tf.get(term) ?? 0
    if (dtf > 0) {
      const wd = tfWeight(dtf) * idf(term, corpus)
      dot += wq * wd
    }
  }

  // doc norm (only terms in doc tf map)
  for (const [term, dtf] of doc.tf) {
    const wd = tfWeight(dtf) * idf(term, corpus)
    dnorm2 += wd * wd
  }

  const denom = Math.sqrt(qnorm2) * Math.sqrt(dnorm2)
  if (denom === 0) return 0
  return dot / denom
}

