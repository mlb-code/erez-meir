/**
 * כלי פיתוח: מושך את כל המודעות הפעילות, מריץ עליהן את מנוע ההתאמות
 * ומדפיס את מה שנמצא. משמש כדי לוודא שנתוני הדמו אכן מייצרים שרשראות.
 *
 *   npm run verify:matches
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { computeMatches, describeCycle, type MatchableListing } from '../src/lib/matching/engine';
import { formatCurrency } from '../src/lib/format';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] ??= match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const { data, error } = await supabase
  .from('listings')
  .select(
    'id, city, neighborhood, rooms, size_sqm, asking_value, has_elevator, has_parking, has_balcony, has_safe_room, condition, wanted_cities, wanted_min_rooms, wanted_max_rooms, wanted_min_sqm, must_haves, cash_add_max, cash_receive_min',
  )
  .eq('status', 'active');

if (error) throw error;

const listings = (data ?? []) as unknown as MatchableListing[];
const byId = new Map(listings.map((l) => [l.id, l]));
const matches = computeMatches(listings);

const direct = matches.filter((m) => m.match_type === 'direct');
const chains3 = matches.filter((m) => m.chain_listing_ids.length === 3);
const chains4 = matches.filter((m) => m.chain_listing_ids.length === 4);
const chains5 = matches.filter((m) => m.chain_listing_ids.length === 5);

console.log(`\nמודעות פעילות: ${listings.length}`);
console.log(`סה"כ התאמות: ${matches.length}`);
console.log(`  התאמות ישירות: ${direct.length}`);
console.log(`  שרשראות של 3: ${chains3.length}`);
console.log(`  שרשראות של 4: ${chains4.length}`);
console.log(`  שרשראות של 5: ${chains5.length}\n`);

for (const match of matches) {
  const cycle = match.chain_listing_ids.map((id) => byId.get(id)!);
  const label = match.match_type === 'direct' ? 'ישירה' : `שרשרת של ${cycle.length}`;
  const steps = describeCycle(cycle)
    .map(({ from, to, cash }) => {
      const money =
        cash === 0
          ? 'ללא השלמה'
          : cash > 0
            ? `משלים ${formatCurrency(cash)}`
            : `מקבל ${formatCurrency(-cash)}`;
      return `${from.city}/${from.rooms} ← ${to.city}/${to.rooms} (${money})`;
    })
    .join('  |  ');
  console.log(`[${match.score}] ${label}: ${steps}`);
}
console.log();
