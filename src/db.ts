import { Pool } from 'pg';

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var ${name}`);
  return v;
}

export const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? '5432'),
  database: process.env.POSTGRES_DB ?? 'websearch',
  user: process.env.POSTGRES_USER ?? 'websearch',
  password: process.env.POSTGRES_PASSWORD ?? 'websearch'
});

export async function withClient<T>(fn: (c: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    return await fn(c);
  } finally {
    c.release();
  }
}

export async function ping(): Promise<void> {
  await pool.query('select 1 as ok');
}

