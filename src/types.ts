export type DocId = string

export type DocumentInput = {
  id: DocId
  title?: string
  body?: string
}

export type SearchOptions = {
  k?: number
}

export type SuggestOptions = {
  k?: number
}

export type SearchHit = {
  id: DocId
  score: number
}

