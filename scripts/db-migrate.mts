/**
 * מריץ את כל קובצי המיגרציה ב-supabase/migrations לפי סדר, פעם אחת כל אחד.
 * המעקב בטבלה public._migrations. כל קובץ רץ בטרנזקציה משלו.
 *   npm run db:migrate            — מריץ את מה שעוד לא רץ
 *   npm run db:migrate -- --status — רק מציג מצב
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import pg from 'pg';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

const dir = new URL('../supabase/migrations/', import.meta.url);
const files = readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
const statusOnly = process.argv.includes('--status');

const db = new pg.Client({
  host: process.env.SUPABASE_DB_HOST, port: 5432, user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD, database: 'postgres', ssl: { rejectUnauthorized: false },
});
await db.connect();
await db.query(`create table if not exists public._migrations (
  name text primary key, checksum text not null, applied_at timestamptz not null default now())`);
await db.query(`revoke all on public._migrations from anon, authenticated`);

const applied = new Map<string, string>(
  (await db.query('select name, checksum from public._migrations')).rows.map((r) => [r.name, r.checksum]),
);

let ran = 0;
for (const file of files) {
  const sql = readFileSync(new URL(file, dir), 'utf8');
  const checksum = createHash('sha256').update(sql).digest('hex').slice(0, 16);
  if (applied.has(file)) {
    const drift = applied.get(file) !== checksum ? '  ⚠️ הקובץ השתנה אחרי שהורץ' : '';
    console.log(`  = ${file} (כבר רץ)${drift}`);
    continue;
  }
  if (statusOnly) { console.log(`  ○ ${file} (ממתין)`); continue; }
  const t = Date.now();
  try {
    await db.query('begin');
    await db.query(sql);
    await db.query('insert into public._migrations (name, checksum) values ($1, $2)', [file, checksum]);
    await db.query('commit');
    console.log(`  ✓ ${file} (${((Date.now() - t) / 1000).toFixed(1)} שנ')`);
    ran++;
  } catch (error) {
    await db.query('rollback');
    console.error(`  ✗ ${file} נכשל, בוטל:\n    ${(error as Error).message}`);
    await db.end();
    process.exit(1);
  }
}
console.log(statusOnly ? 'סטטוס בלבד.' : ran ? `הורצו ${ran} מיגרציות.` : 'אין מיגרציות חדשות.');
await db.end();
