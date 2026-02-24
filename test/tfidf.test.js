import { describe, expect, it } from 'vitest';
import { tfidfCosineScore } from '../src/tfidf.js';
describe('tfidfCosineScore', () => {
    it('scores matching doc higher than non-matching', () => {
        const corpus = {
            docCount: 2,
            df: new Map([
                ['apple', 1],
                ['banana', 1],
                ['carrot', 1],
            ]),
        };
        const docA = { docLen: 2, tf: new Map([['apple', 2]]) };
        const docB = { docLen: 2, tf: new Map([['carrot', 2]]) };
        const q = ['apple'];
        expect(tfidfCosineScore(q, docA, corpus)).toBeGreaterThan(0);
        expect(tfidfCosineScore(q, docB, corpus)).toBe(0);
    });
});
//# sourceMappingURL=tfidf.test.js.map