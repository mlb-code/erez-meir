/**
 * אחרי seed.sql: מחשב את ההתאמות עם מנוע ה-TypeScript, שומר אותן,
 * ומסדר את מצב הדמו — שרשרת של 4 שכולם אישרו עם צ'אט, ושרשרת של 3 שממתינה.
 *   npx tsx scripts/seed-matches.mts
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { computeMatches, type MatchableListing } from '../src/lib/matching/engine';
import { DEMO_EXPECTED_MATCHES } from '../src/lib/constants';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

const db = new pg.Client({
  host: process.env.SUPABASE_DB_HOST, port: 5432, user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD, database: 'postgres', ssl: { rejectUnauthorized: false },
});
await db.connect();

const { rows } = await db.query(`
  select l.id, l.owner_id, l.asset_type::text as asset_type, l.city, l.neighborhood_id, l.rooms::float, l.size_sqm, l.floor,
         l.asking_value::float, l.has_elevator, l.has_parking, l.has_balcony, l.has_safe_room, l.condition::text as condition,
         l.building_year, l.urban_renewal_status::text as urban_renewal_status, l.has_mortgage, l.has_caveats, l.has_liens,
         l.has_tenant, l.available_from, l.available_until, l.availability_flex_months, l.locked_until,
         l.wanted_asset_types::text[] as wanted_asset_types, l.wanted_cities, l.wanted_neighborhood_ids::text[] as wanted_neighborhood_ids,
         l.wanted_min_rooms::float, l.wanted_max_rooms::float, l.wanted_min_sqm, l.wanted_min_floor,
         l.wanted_value_min::float, l.wanted_value_max::float, l.wanted_available_from, l.wanted_available_until,
         l.must_haves::text[] as must_haves, l.soft_prefs, l.cash_add_max::float, l.cash_receive_min::float,
         l.land_is_fenced, l.land_is_vacant,
         (p.identity_status = 'verified') as identity_verified, u.email
  from public.listings l join auth.users u on u.id = l.owner_id join public.profiles p on p.id = l.owner_id
  where l.status = 'active'`);

const emailOf = new Map(rows.map((r) => [r.id, r.email as string]));
// הדמו מחשב עד 5 כדי לשמור את השרשרת של 4 (מדיניות התצוגה בייצור: MAX_CHAIN_LENGTH_SHOWN)
const matches = computeMatches(rows as unknown as MatchableListing[], 5);

// נתוני הדמו מתוכננים למעגלים מסוימים (§16.2, חבילה C1). סטייה כאן פירושה
// ששינוי ב-seed.sql הזיז קשת בגרף — עוצרים לפני שכותבים מצב דמו שגוי.
const found = {
  direct: matches.filter((m) => m.match_type === 'direct').length,
  chains3: matches.filter((m) => m.chain_listing_ids.length === 3).length,
  chains4: matches.filter((m) => m.chain_listing_ids.length === 4).length,
};
if (
  found.direct !== DEMO_EXPECTED_MATCHES.direct ||
  found.chains3 !== DEMO_EXPECTED_MATCHES.chains3 ||
  found.chains4 !== DEMO_EXPECTED_MATCHES.chains4
) {
  console.error(
    `נתוני הדמו סוטים מהמתוכנן: ציפינו ל-${DEMO_EXPECTED_MATCHES.direct}/${DEMO_EXPECTED_MATCHES.chains3}/${DEMO_EXPECTED_MATCHES.chains4} ` +
      `(ישירות/שרשראות של 3/שרשרת של 4) וקיבלנו ${found.direct}/${found.chains3}/${found.chains4}.`,
  );
  await db.end();
  process.exit(1);
}

await db.query('delete from public.matches');
for (const m of matches) {
  await db.query(
    `insert into public.matches (match_type, chain_listing_ids, score, scores, estimated_close_probability)
     values ($1, $2::uuid[], $3, $4::jsonb, $5) on conflict (chain_listing_ids) do nothing`,
    [m.match_type, m.chain_listing_ids, m.score, JSON.stringify(m.scores), m.estimated_close_probability],
  );
}
console.log(`התאמות נשמרו: ${matches.length} (${matches.filter(m => m.match_type==='direct').length} ישירות, ${matches.filter(m => m.match_type==='chain').length} שרשראות)`);

// --- מצב הדמו: השרשרת של 4 — כולם אישרו + שיחה ---
const four = matches.find((m) => m.chain_listing_ids.length === 4);
if (four) {
  const { rows: [{ id: matchId }] } = await db.query(
    'select id from public.matches where chain_listing_ids = $1::uuid[]', [four.chain_listing_ids]);
  for (const lid of four.chain_listing_ids) {
    await db.query(`insert into public.match_responses (match_id, listing_id, response) values ($1,$2,'interested')
                    on conflict (match_id, listing_id) do nothing`, [matchId, lid]);
  }
  const msgs: [string, string, string][] = [
    ['eran@demo.swap.co.il',  'שלום לכולם. אני ערן, בעל הדירה בגבעתיים. שמח שהמעגל נסגר — אשמח שנתאם סבב ביקורים.', '2 days 4 hours'],
    ['hadas@demo.swap.co.il', 'היי, הדס מפתח תקווה. גם אני בעד. מבחינתי כל יום אחרי 17:00 או שישי בבוקר.', '2 days 3 hours'],
    ['itai@demo.swap.co.il',  'איתי מראשון לציון. שישי בבוקר מצוין. אני מציע שנתחיל אצל ערן ונמשיך לפי סדר המעגל.', '2 days 1 hour'],
    ['maya@demo.swap.co.il',  'מאיה מנווה צדק. מסכימה. חשוב שכל אחד יביא נסח טאבו ואישור זכויות, ושנעביר את זה לעורכי הדין לפני שנתקדם.', '1 day 20 hours'],
    ['eran@demo.swap.co.il',  'מעולה. נקבע לשישי הקרוב ב-9:00 אצלי, ומשם ממשיכים. אני מעדכן את עורך הדין שלי היום.', '1 day 18 hours'],
  ];
  for (const [email, body, ago] of msgs) {
    await db.query(`insert into public.messages (match_id, sender_id, body, created_at)
                    select $1, u.id, $2, now() - $3::interval from auth.users u where u.email = $4`, [matchId, body, ago, email]);
  }
  console.log('שרשרת של 4: כולם אישרו + 5 הודעות ✓');
}

// --- שרשרת של 3 עם דוד — רק דוד אישר (ממתין לאחרים) ---
const davidChain = matches.find((m) => m.chain_listing_ids.length === 3 && m.chain_listing_ids.some((id) => emailOf.get(id) === 'david@demo.swap.co.il'));
if (davidChain) {
  const davidListing = davidChain.chain_listing_ids.find((id) => emailOf.get(id) === 'david@demo.swap.co.il')!;
  await db.query(`insert into public.match_responses (match_id, listing_id, response)
                  select id, $2, 'interested' from public.matches where chain_listing_ids = $1::uuid[]
                  on conflict do nothing`, [davidChain.chain_listing_ids, davidListing]);
  console.log('שרשרת של 3 (דוד): ממתינה לאישור השאר ✓');
}

const { rows: [st] } = await db.query(`select
  (select count(*) from public.listings where status='active') listings,
  (select count(*) from public.matches) matches,
  (select count(*) from public.matches where status='all_interested') open_chats,
  (select count(*) from public.matches where status='interested_partial') partial,
  (select count(*) from public.messages) messages`);
console.log('מצב סופי:', st);
await db.end();
