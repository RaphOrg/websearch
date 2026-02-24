class TrieNode {
  children = new Map<string, TrieNode>()
  isWord = false
}

export class Trie {
  private root = new TrieNode()

  insert(term: string): void {
    if (!term) return
    let cur = this.root
    for (const ch of term) {
      let nxt = cur.children.get(ch)
      if (!nxt) {
        nxt = new TrieNode()
        cur.children.set(ch, nxt)
      }
      cur = nxt
    }
    cur.isWord = true
  }

  contains(term: string): boolean {
    if (!term) return false
    let cur = this.root
    for (const ch of term) {
      const nxt = cur.children.get(ch)
      if (!nxt) return false
      cur = nxt
    }
    return cur.isWord
  }

  prefix(pref: string, limit = 10): string[] {
    if (limit <= 0) return []
    let cur = this.root
    for (const ch of pref) {
      const nxt = cur.children.get(ch)
      if (!nxt) return []
      cur = nxt
    }
    const out: string[] = []
    const dfs = (node: TrieNode, acc: string) => {
      if (out.length >= limit) return
      if (node.isWord) out.push(acc)
      const keys = [...node.children.keys()].sort() // stable suggestions
      for (const k of keys) {
        if (out.length >= limit) return
        dfs(node.children.get(k)!, acc + k)
      }
    }
    dfs(cur, pref)
    return out
  }
}

