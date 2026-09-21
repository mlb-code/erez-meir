/**
 * מריץ קובץ SQL ישירות על מסד הנתונים (דרך ה-pooler של Supabase, IPv4).
 *   npx tsx scripts/db-run.mts supabase/schema.sql
 * הפרטים נקראים מ-.env.local: SUPABASE_DB_HOST, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

const file = process.argv[2];
if (!file) { console.error('שימוש: tsx scripts/db-run.mts <file.sql>'); process.exit(1); }

const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST,
  port: 5432,
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const sql = readFileSync(file, 'utf8');
const started = Date.now();
try {
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');
  console.log(`✓ ${file} — הורץ בהצלחה (${((Date.now() - started) / 1000).toFixed(1)} שנ')`);
} catch (error) {
  await client.query('rollback');
  console.error(`✗ ${file} נכשל, בוטל (rollback):`, (error as Error).message);
  process.exit(1);
} finally {
  await client.end();
}
