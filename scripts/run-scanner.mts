/**
 * הסורק היומי (§9.2) — לשימוש ה-cron (E7). מצליב נכסים שנחשפו מול עסקאות ציבוריות
 * ויוצר scan_alerts. אידמפוטנטי: אותה עסקה לאותו נכס לא תיווצר פעמיים.
 *   npm run scanner:daily
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { scanForBypass, type ClosingReport, type Exposure, type PublicTransaction, type ScannedListing } from '../src/lib/scanner/scan';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}
const db = new pg.Client({
  host: process.env.SUPABASE_DB_HOST, port: 5432, user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD, database: 'postgres', ssl: { rejectUnauthorized: false },
});
await db.connect();
const started = Date.now();

// חשיפה מלאה ראשונה של כל נכס בכל מעגל, ב-24 החודשים האחרונים
const { rows: exposureRows } = await db.query(`
  select e.listing_id, e.match_id, min(e.at) as first_exposed_at, m.chain_listing_ids
  from public.exposure_log e join public.matches m on m.id = e.match_id
  where e.level = 'full' and e.at > now() - interval '24 months'
  group by e.listing_id, e.match_id, m.chain_listing_ids`);
const exposures: Exposure[] = exposureRows.map((r) => ({
  listing_id: r.listing_id, match_id: r.match_id, first_exposed_at: new Date(r.first_exposed_at), match_listing_ids: r.chain_listing_ids,
}));
const listingIds = [...new Set(exposures.flatMap((e) => e.match_listing_ids))];

const { rows: listingRows } = listingIds.length
  ? await db.query(`select id, gush, helka, tat_helka, city, street, house_number from public.listings where id = any($1::uuid[])`, [listingIds])
  : { rows: [] };
const listings = listingRows as ScannedListing[];

const { rows: txRows } = await db.query(`
  select id, gush, helka, tat_helka, city, street, house_number, sale_date, price::float
  from public.public_transactions where sale_date > (now() - interval '25 months')::date`);
const transactions: PublicTransaction[] = txRows.map((r) => ({ ...r, sale_date: new Date(r.sale_date) }));

const { rows: closingRows } = await db.query(`select listing_id, match_id from public.closings`);
const results = scanForBypass(listings, exposures, transactions, closingRows as ClosingReport[]);

let created = 0;
for (const r of results) {
  const q = await db.query(
    `insert into public.scan_alerts (listing_id, public_transaction_id, match_id, matched_by, counterpart_also_sold, status)
     select $1, $2, $3, $4, $5, $6
     where not exists (select 1 from public.scan_alerts where listing_id = $1 and public_transaction_id = $2)`,
    [r.listing_id, r.public_transaction_id, r.match_id, r.matched_by, r.counterpart_also_sold, r.reported_closing ? 'reported_closing' : 'new'],
  );
  created += q.rowCount ?? 0;
}
console.log(JSON.stringify({ exposures: exposures.length, listings: listings.length, transactions: transactions.length, hits: results.length, created, ms: Date.now() - started }));
await db.end();
