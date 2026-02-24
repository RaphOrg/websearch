export type Token = {
  term: string;
  pos: number;
};

// intentionally dumb tokenizer: lowercase, keep a-z0-9, split on everything else.
export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  const normalized = text.toLowerCase();
  let pos = 0;
  let buf = '';

  function flush() {
    if (!buf) return;
    out.push({ term: buf, pos });
    pos += 1;
    buf = '';
  }

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const ok = (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9');
    if (ok) buf += ch;
    else flush();
  }
  flush();

  return out;
}

export function tokensToPostings(tokens: Token[]): Map<string, { tf: number; positions: number[] }> {
  const map = new Map<string, { tf: number; positions: number[] }>();
  for (const t of tokens) {
    const cur = map.get(t.term);
    if (!cur) map.set(t.term, { tf: 1, positions: [t.pos] });
    else {
      cur.tf += 1;
      cur.positions.push(t.pos);
    }
  }
  return map;
}

