import fs from 'node:fs';
import path from 'node:path';
import { ping, withClient } from './db';
import { ingestFile } from './ingest/ingest';
import { generateJsonl } from './ingest/generate';

async function dbInit() {
  // best-effort: run the init SQL directly as well (useful outside docker entrypoint).
  const sqlPath = path.resolve('scripts/sql/001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await withClient(async (c) => {
    await c.query(sql);
  });
}

async function bench() {
  const ingestPath = process.env.INGEST_PATH ?? './data/documents.jsonl';

  const t0 = performance.now();
  await ingestFile(ingestPath, { batchSize: 500, index: true });
  const t1 = performance.now();

  // sample query latency: term -> top 20 postings by tf
  const q0 = performance.now();
  await withClient(async (c) => {
    await c.query(
      `select p.doc_id, p.tf
       from postings p
       where p.term = $1
       order by p.tf desc
       limit 20`,
      ['the']
    );
  });
  const q1 = performance.now();

  console.log(`index_time_ms=${(t1 - t0).toFixed(1)}`);
  console.log(`sample_query_ms=${(q1 - q0).toFixed(1)}`);
}

async function main() {
  const cmd = process.argv[2];
  if (!cmd) throw new Error('usage: tsx src/cli.ts <db:init|ingest|bench|gen>');

  await ping();

  if (cmd === 'db:init') {
    await dbInit();
    console.log('ok: db initialized');
    return;
  }

  if (cmd === 'ingest') {
    const ingestPath = process.env.INGEST_PATH ?? process.argv[3];
    if (!ingestPath) throw new Error('missing INGEST_PATH or path arg');
    await ingestFile(ingestPath, { batchSize: 500, index: true });
    console.log('ok: ingest done');
    return;
  }

  if (cmd === 'bench') {
    await bench();
    return;
  }

  if (cmd === 'gen') {
    const outPath = process.argv[3] ?? './data/documents.jsonl';
    const count = Number(process.argv[4] ?? '50000');
    generateJsonl(outPath, count);
    console.log(`ok: generated ${count} docs at ${outPath}`);
    return;
  }

  throw new Error(`unknown cmd: ${cmd}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

