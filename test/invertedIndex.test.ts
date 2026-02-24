import { describe, expect, it } from 'vitest'
import { InvertedIndex } from '../src/invertedIndex.js'

describe('InvertedIndex', () => {
  it('stores postings with tf + positions', () => {
    const idx = new InvertedIndex()
    idx.addDocument('a', ['hello', 'world', 'hello'])
    idx.addDocument('b', ['hello'])

    const postings = idx.postings('hello')
    const byDoc = new Map(postings.map((p) => [p.docId, p]))
    expect(byDoc.get('a')?.tf).toBe(2)
    expect(byDoc.get('a')?.positions).toEqual([0, 2])
    expect(byDoc.get('b')?.tf).toBe(1)
    expect(byDoc.get('b')?.positions).toEqual([0])
  })

  it('finalize prevents mutation', () => {
    const idx = new InvertedIndex()
    idx.addDocument('a', ['x'])
    idx.finalize()
    expect(() => idx.addDocument('b', ['x'])).toThrow(/finalized/i)
  })
})

