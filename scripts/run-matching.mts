/**
 * ריצה יומית של מנוע ההתאמות (§6.4) — לשימוש ה-cron (חבילה E7).
 * מחשב את כל המעגלים, שומר חדשים, מעדכן ציונים של "suggested", ומסמן מעגלים שפגו.
 *   npm run matching:daily
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { computeMatches, type MatchableListing } from '../src/lib/matching/engine';
import { MATCHING_CONFIG } from '../src/lib/matching/config';

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

const { rows } = await db.query(`
  select l.id, l.owner_id, l.asset_type::text as asset_type, l.city, l.neighborhood_id, l.rooms::float, l.size_sqm, l.floor,
         l.asking_value::float, l.has_elevator, l.has_parking, l.has_balcony, l.has_safe_room, l.condition::text as condition,
         l.building_year, l.urban_renewal_status::text as urban_renewal_status, l.has_mortgage, l.has_caveats, l.has_liens,
         l.has_tenant, l.available_from, l.available_until, l.availability_flex_months, l.locked_until,
         l.wanted_asset_types::text[] as wanted_asset_types, l.wanted_cities, l.wanted_neighborhood_ids::text[] as wanted_neighborhood_ids,
         l.wanted_min_rooms::float, l.wanted_max_rooms::float, l.wanted_min_sqm, l.wanted_min_floor,
         l.wanted_value_min::float, l.wanted_value_max::float, l.wanted_available_from, l.wanted_available_until,
         l.must_haves::text[] as must_haves, l.soft_prefs, l.cash_add_max::float, l.cash_receive_min::float,
         (p.identity_status = 'verified') as identity_verified
  from public.listings l join public.profiles p on p.id = l.owner_id
  where l.status = 'active'`);

const maxLength = Number(process.env.MATCHING_MAX_LENGTH ?? MATCHING_CONFIG.MAX_CHAIN_LENGTH_SHOWN);
const matches = computeMatches(rows as unknown as MatchableListing[], maxLength);

let inserted = 0, updated = 0;
for (const m of matches) {
  const r = await db.query(
    `insert into public.matches (match_type, chain_listing_ids, score, scores, estimated_close_probability)
     values ($1, $2::uuid[], $3, $4::jsonb, $5)
     on conflict (chain_listing_ids) do update
       set score = excluded.score, scores = excluded.scores, estimated_close_probability = excluded.estimated_close_probability,
           status = case when public.matches.status = 'expired' then 'suggested' else public.matches.status end
       where public.matches.status in ('suggested', 'expired')
     returning (xmax = 0) as inserted`,
    [m.match_type, m.chain_listing_ids, m.score, JSON.stringify(m.scores), m.estimated_close_probability],
  );
  if (r.rows[0]?.inserted) inserted++; else if (r.rowCount) updated++;
}

const expired = await db.query(`
  update public.matches m set status = 'expired'
   where m.status in ('suggested', 'interested_partial', 'all_interested')
     and exists (select 1 from unnest(m.chain_listing_ids) cid
                 join public.listings l on l.id = cid
                 where l.status <> 'active' or (l.locked_until is not null and l.locked_until > now()))`);

console.log(JSON.stringify({
  listings: rows.length, maxLength, found: matches.length, inserted, updated, expired: expired.rowCount,
  ms: Date.now() - started,
}));
await db.end();
