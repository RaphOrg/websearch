import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { withClient } from '../db';
import { tokenize, tokensToPostings } from './tokenize';

export type IngestDoc = {
  external_id?: string;
  title?: string;
  body?: string;
  meta?: unknown;
  created_at?: string;
};

function parseJsonlLine(line: string): IngestDoc | null {
  const s = line.trim();
  if (!s) return null;
  return JSON.parse(s);
}

// super-minimal CSV: header row required, commas only, no quoted commas.
function parseCsv(content: string): IngestDoc[] {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map((h) => h.trim());
  const out: IngestDoc[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const obj: any = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = cols[j];
    out.push(obj);
  }
  return out;
}

export async function ingestFile(filePath: string, opts?: { batchSize?: number; index?: boolean }) {
  const batchSize = opts?.batchSize ?? 500;
  const doIndex = opts?.index ?? false;

  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  const ext = path.extname(abs).toLowerCase();

  if (ext === '.csv') {
    const docs = parseCsv(fs.readFileSync(abs, 'utf8'));
    await ingestDocs(docs, { batchSize, index: doIndex });
    return;
  }

  // default: jsonl
  const rl = readline.createInterface({ input: fs.createReadStream(abs), crlfDelay: Infinity });
  const buf: IngestDoc[] = [];
  for await (const line of rl) {
    const doc = parseJsonlLine(line);
    if (!doc) continue;
    buf.push(doc);
    if (buf.length >= batchSize) {
      const batch = buf.splice(0, buf.length);
      await ingestDocs(batch, { batchSize, index: doIndex });
    }
  }
  if (buf.length) await ingestDocs(buf, { batchSize, index: doIndex });
}

export async function ingestDocs(docs: IngestDoc[], opts?: { batchSize?: number; index?: boolean }) {
  const doIndex = opts?.index ?? false;

  await withClient(async (c) => {
    await c.query('begin');
    try {
      for (const d of docs) {
        const externalId = d.external_id ?? null;
        const title = d.title ?? '';
        const body = d.body ?? '';
        const meta = d.meta ?? {};
        const createdAt = d.created_at ?? null;

        const res = await c.query(
          `insert into documents (external_id, title, body, meta, created_at)
           values ($1,$2,$3,$4, coalesce($5::timestamptz, now()))
           on conflict (external_id) do update set
             title = excluded.title,
             body = excluded.body,
             meta = excluded.meta
           returning id`,
          [externalId, title, body, meta, createdAt]
        );
        const docId: number = res.rows[0].id;

        if (doIndex) {
          const tokens = tokenize(`${title}\n${body}`);
          const postings = tokensToPostings(tokens);

          // upsert terms
          if (postings.size) {
            const terms = [...postings.keys()];
            await c.query(
              `insert into terms(term)
               select unnest($1::text[])
               on conflict do nothing`,
              [terms]
            );

            // replace postings for this doc (simple + deterministic)
            await c.query('delete from postings where doc_id = $1', [docId]);

            for (const [term, p] of postings) {
              await c.query(
                `insert into postings(term, doc_id, tf, positions)
                 values ($1,$2,$3,$4)`,
                [term, docId, p.tf, p.positions]
              );
            }
          }
        }
      }

      await c.query('commit');
    } catch (e) {
      await c.query('rollback');
      throw e;
    }
  });
}

