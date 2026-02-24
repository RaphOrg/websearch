import { describe, expect, it } from 'vitest'
import { Trie } from '../src/trie.js'

describe('Trie', () => {
  it('insert/contains works', () => {
    const t = new Trie()
    t.insert('cat')
    t.insert('car')
    expect(t.contains('cat')).toBe(true)
    expect(t.contains('ca')).toBe(false)
    expect(t.contains('dog')).toBe(false)
  })

  it('prefix returns sorted terms with limit', () => {
    const t = new Trie()
    ;['car', 'cat', 'cap', 'can'].forEach((x) => t.insert(x))
    expect(t.prefix('ca', 3)).toEqual(['can', 'cap', 'car'])
    expect(t.prefix('cz', 5)).toEqual([])
    expect(t.prefix('ca', 0)).toEqual([])
  })
})

