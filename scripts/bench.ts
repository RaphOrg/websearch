import { SearchIndex } from '../src/searchIndex.js'

function randInt(n: number) {
  return Math.floor(Math.random() * n)
}

function makeVocab(size: number) {
  const v: string[] = []
  for (let i = 0; i < size; i++) v.push(`t${i}`)
  return v
}

function makeDoc(vocab: string[], len: number): string {
  const parts: string[] = []
  for (let i = 0; i < len; i++) parts.push(vocab[randInt(vocab.length)])
  return parts.join(' ')
}

const DOCS = Number(process.env.DOCS ?? 50_000)
const VOCAB = Number(process.env.VOCAB ?? 5_000)
const LEN = Number(process.env.LEN ?? 40)

const vocab = makeVocab(VOCAB)
const idx = new SearchIndex()

console.time('index:addDocument')
for (let i = 0; i < DOCS; i++) {
  idx.addDocument({ id: String(i), title: '', body: makeDoc(vocab, LEN) })
}
console.timeEnd('index:addDocument')

const q = `${vocab[1]} ${vocab[2]} ${vocab[3]}`
console.time('search')
const hits = idx.search(q, { k: 10 })
console.timeEnd('search')
console.log('query:', q)
console.log('top hits:', hits.slice(0, 5))

