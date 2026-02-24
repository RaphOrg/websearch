import { describe, expect, it } from 'vitest';
import { MinHeap, topK } from '../src/minHeap.js';
describe('MinHeap', () => {
    it('push/pop yields ascending order', () => {
        const h = new MinHeap((a, b) => a - b);
        [5, 1, 3, 2, 4].forEach((n) => h.push(n));
        const out = [];
        while (h.size())
            out.push(h.pop());
        expect(out).toEqual([1, 2, 3, 4, 5]);
    });
});
describe('topK', () => {
    it('returns top K by score', () => {
        const items = ['a', 'b', 'c', 'd'];
        const scores = new Map([
            ['a', 1],
            ['b', 10],
            ['c', 3],
            ['d', 7],
        ]);
        expect(topK(items, 2, (x) => scores.get(x))).toEqual(['b', 'd']);
        expect(topK(items, 10, (x) => scores.get(x))).toEqual(['b', 'd', 'c', 'a']);
        expect(topK(items, 0, (x) => scores.get(x))).toEqual([]);
    });
});
//# sourceMappingURL=minHeap.test.js.map