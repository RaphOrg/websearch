export type Comparator<T> = (a: T, b: T) => number

export class MinHeap<T> {
  private data: T[] = []
  constructor(private readonly compare: Comparator<T>) {}

  size(): number {
    return this.data.length
  }

  peek(): T | undefined {
    return this.data[0]
  }

  push(item: T): void {
    this.data.push(item)
    this.bubbleUp(this.data.length - 1)
  }

  pop(): T | undefined {
    const n = this.data.length
    if (n === 0) return undefined
    const root = this.data[0]
    const last = this.data.pop()!
    if (n > 1) {
      this.data[0] = last
      this.bubbleDown(0)
    }
    return root
  }

  toArray(): T[] {
    return [...this.data]
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2)
      if (this.compare(this.data[i], this.data[p]) >= 0) break
      ;[this.data[i], this.data[p]] = [this.data[p], this.data[i]]
      i = p
    }
  }

  private bubbleDown(i: number) {
    const n = this.data.length
    while (true) {
      const l = 2 * i + 1
      const r = 2 * i + 2
      let m = i
      if (l < n && this.compare(this.data[l], this.data[m]) < 0) m = l
      if (r < n && this.compare(this.data[r], this.data[m]) < 0) m = r
      if (m === i) break
      ;[this.data[i], this.data[m]] = [this.data[m], this.data[i]]
      i = m
    }
  }
}

export function topK<T>(items: Iterable<T>, k: number, score: (t: T) => number): T[] {
  if (k <= 0) return []
  const heap = new MinHeap<{ item: T; s: number }>((a, b) => a.s - b.s)
  for (const item of items) {
    const s = score(item)
    if (heap.size() < k) heap.push({ item, s })
    else if ((heap.peek()!.s ?? -Infinity) < s) {
      heap.pop()
      heap.push({ item, s })
    }
  }
  return heap
    .toArray()
    .sort((a, b) => b.s - a.s)
    .map((x) => x.item)
}

