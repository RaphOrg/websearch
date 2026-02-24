import { describe, expect, it } from 'vitest';
import { SearchIndex } from '../src/searchIndex.js';
describe('SearchIndex', () => {
    it('add/search returns ranked hits', () => {
        const idx = new SearchIndex();
        idx.addDocument({ id: '1', title: 'Apple pie', body: 'tasty apple apple' });
        idx.addDocument({ id: '2', title: 'Carrot cake', body: 'tasty carrot carrot' });
        idx.addDocument({ id: '3', title: 'Apple tart', body: 'apple' });
        const hits = idx.search('apple', { k: 2 });
        expect(hits.length).toBe(2);
        expect(hits[0].score).toBeGreaterThanOrEqual(hits[1].score);
        expect(new Set(hits.map((h) => h.id))).toEqual(new Set(['1', '3']));
    });
    it('suggest returns prefix matches', () => {
        const idx = new SearchIndex();
        idx.addDocument({ id: '1', title: 'cat car cap', body: '' });
        expect(idx.suggest('ca', { k: 10 })).toEqual(['cap', 'car', 'cat']);
    });
    it('finalize prevents addDocument', () => {
        const idx = new SearchIndex();
        idx.addDocument({ id: '1', title: 'a', body: 'b' });
        idx.finalize();
        expect(() => idx.addDocument({ id: '2', title: 'x', body: 'y' })).toThrow(/finalized/i);
    });
});
//# sourceMappingURL=searchIndex.test.js.map