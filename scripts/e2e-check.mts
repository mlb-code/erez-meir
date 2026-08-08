/**
 * בדיקת קצה־אל־קצה של שכבת הנתונים מול Supabase האמיתי:
 * התחברות → חישוב התאמות ושמירתן → קריאת ההתאמות לפי RLS →
 * אישור של כל המשתתפים → פתיחת הצ'אט → שליחת הודעה → בדיקת בידוד RLS.
 *
 *   npm run check:e2e
 */
import { readFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { computeMatches, type MatchableListing } from '../src/lib/matching/engine';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] ??= match[2].trim();
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PASSWORD = 'Demo1234!';

const ENGINE_FIELDS =
  'id, city, rooms, size_sqm, asking_value, has_elevator, has_parking, has_balcony, ' +
  'has_safe_room, condition, wanted_cities, wanted_min_rooms, wanted_max_rooms, ' +
  'wanted_min_sqm, must_haves, cash_add_max, cash_receive_min';

let failures = 0;
function check(label: string, condition: boolean, detail = '') {
  console.log(`${condition ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!condition) failures++;
}

function anon() {
  return createClient(URL_, KEY, { auth: { persistSession: false } });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * התחברות עם המתנה חוזרת. Supabase מגביל את קצב ההתחברויות,
 * והסקריפט הזה מתחבר בשם הרבה משתמשים ברצף.
 */
async function signIn(email: string): Promise<{ client: SupabaseClient; userId: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const client = anon();
    const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
    if (data?.user) return { client, userId: data.user.id };
    if (!error?.message.toLowerCase().includes('rate limit')) {
      throw new Error(`התחברות נכשלה עבור ${email}: ${error?.message}`);
    }
    await sleep(5000 * (attempt + 1));
  }
  throw new Error(`התחברות נכשלה עבור ${email}: מגבלת קצב. כדאי להריץ שוב בעוד דקה.`);
}

// ---------------------------------------------------------------------------

console.log('\n1) התחברות כמשתמש דמו');
const { client: yehuda, userId: yehudaId } = await signIn('yehuda@demo.swap.co.il');
check('התחברות הצליחה', Boolean(yehudaId));

console.log('\n2) הרצת מנוע ההתאמות ושמירה דרך ה-RPC');
const { data: rows } = await yehuda.from('listings').select(ENGINE_FIELDS).eq('status', 'active');
const matches = computeMatches((rows ?? []) as unknown as MatchableListing[]);
const { data: savedCount, error: rpcError } = await yehuda.rpc('save_matches', {
  p_matches: matches,
});
check('ה-RPC רץ בלי שגיאה', !rpcError, rpcError?.message ?? '');
check('נשמרו כל המעגלים שנמצאו', savedCount === matches.length, `${savedCount}/${matches.length}`);

console.log('\n3) קריאת ההתאמות תחת RLS');
const { data: yehudaMatches } = await yehuda
  .from('matches')
  .select('id, match_type, chain_listing_ids, status, score');
check('יהודה רואה לפחות התאמה אחת', (yehudaMatches?.length ?? 0) > 0, `${yehudaMatches?.length}`);

const { data: allListings } = await yehuda.from('listings').select('id, owner_id, city, rooms');
const listingById = new Map((allListings ?? []).map((l) => [l.id, l]));
const inAllMine = (yehudaMatches ?? []).every((m) =>
  (m.chain_listing_ids as string[]).some((id) => listingById.get(id)?.owner_id === yehudaId),
);
check('כל התאמה שהוא רואה כוללת מודעה שלו', inAllMine);

console.log('\n4) בחירת שרשרת ואישור של כל המשתתפים');
const { data: chainRows } = await yehuda
  .from('matches')
  .select('id, chain_listing_ids, match_type')
  .eq('match_type', 'chain');

// נבחר שרשרת כלשהי מהמערכת דרך משתתף שלה
const { client: eran } = await signIn('eran@demo.swap.co.il');
const { data: eranChains } = await eran
  .from('matches')
  .select('id, chain_listing_ids, status')
  .eq('match_type', 'chain');

const chain = eranChains?.[0];
check('נמצאה שרשרת לבדיקה', Boolean(chain), chain ? `${chain.chain_listing_ids.length} משתתפים` : '');
if (!chain) {
  console.log(`\nיהודה: ${yehudaMatches?.length} התאמות, שרשראות במערכת: ${chainRows?.length}`);
  process.exit(1);
}

// מיפוי מודעה → אימייל הבעלים, כדי להתחבר בשם כל אחד מהם
const { data: ownerRows } = await eran
  .from('listings')
  .select('id, owner_id')
  .in('id', chain.chain_listing_ids);

const DEMO_NAMES = [
  'yehuda','michal','avi','tamar','shira','noam','david','orly','roni','gil','efrat','yossi',
  'maya','eran','hadas','itai','lior','sigal','nadav','ruth','amir','galit','shaul','dana','boaz',
];

// מתחברים בשם משתמשי הדמו עד שמזוהים כל בעלי המודעות במעגל, ואז עוצרים.
const chainOwners = new Set((ownerRows ?? []).map((r) => r.owner_id));
const emailByOwner = new Map<string, string>();
const listingByOwner = new Map((ownerRows ?? []).map((r) => [r.owner_id, r.id]));
let outsiderEmail = '';

for (const name of DEMO_NAMES) {
  const email = `${name}@demo.swap.co.il`;
  const { client, userId } = await signIn(email);

  if (chainOwners.has(userId)) {
    emailByOwner.set(userId, email);
    const { error } = await client.from('match_responses').upsert(
      { match_id: chain.id, listing_id: listingByOwner.get(userId)!, response: 'interested' },
      { onConflict: 'match_id,listing_id' },
    );
    if (error) check(`אישור של ${email}`, false, error.message);
  } else if (!outsiderEmail) {
    outsiderEmail = email;
  }

  await client.auth.signOut();
  if (emailByOwner.size === chainOwners.size && outsiderEmail) break;
}

check(
  'כל המשתתפים סימנו "מעוניין"',
  emailByOwner.size === chainOwners.size,
  `${emailByOwner.size}/${chainOwners.size} משתתפים`,
);

console.log('\n5) סטטוס ההתאמה והצ׳אט');
const { client: eran2, userId: eranId } = await signIn('eran@demo.swap.co.il');
const { data: updated } = await eran2
  .from('matches')
  .select('status')
  .eq('id', chain.id)
  .single();
check('הסטטוס התעדכן ל-all_interested', updated?.status === 'all_interested', String(updated?.status));

const { error: msgError } = await eran2
  .from('messages')
  .insert({ match_id: chain.id, sender_id: eranId, body: 'בדיקה אוטומטית: מתי נוח לכם לסבב דירות?' });
check('שליחת הודעה בצ׳אט הצליחה', !msgError, msgError?.message ?? '');

const { data: msgs } = await eran2.from('messages').select('id, body').eq('match_id', chain.id);
check('ההודעה נקראת חזרה', (msgs?.length ?? 0) > 0, `${msgs?.length} הודעות`);

console.log('\n6) חשיפת פרטי קשר רק אחרי שכולם אישרו');
const { data: visibleProfiles } = await eran2
  .from('profiles')
  .select('id, full_name, phone')
  .in('id', (ownerRows ?? []).map((r) => r.owner_id));
check(
  'ערן רואה את פרטי הקשר של השותפים למעגל שנפתח',
  (visibleProfiles?.length ?? 0) === (ownerRows?.length ?? 0),
  `${visibleProfiles?.length}/${ownerRows?.length}`,
);

console.log('\n7) בידוד RLS — מי שלא במעגל לא רואה אותו');
const { client: outsider } = await signIn(outsiderEmail);
const { data: outsiderMatch } = await outsider.from('matches').select('id').eq('id', chain.id);
check('משתמש חיצוני לא מקבל את ההתאמה', (outsiderMatch?.length ?? 0) === 0, outsiderEmail);

const { data: outsiderMsgs } = await outsider.from('messages').select('id').eq('match_id', chain.id);
check('משתמש חיצוני לא קורא את הצ׳אט', (outsiderMsgs?.length ?? 0) === 0);

console.log('\n8) מבקר אנונימי');
const guest = anon();
const { data: guestListings } = await guest.from('listings').select('id').eq('status', 'active');
check('אורח רואה את המודעות הפעילות', (guestListings?.length ?? 0) > 0, `${guestListings?.length}`);
const { data: guestProfiles } = await guest.from('profiles').select('id');
check('אורח לא רואה פרטי קשר', (guestProfiles?.length ?? 0) === 0);
const { data: guestMatches } = await guest.from('matches').select('id');
check('אורח לא רואה התאמות', (guestMatches?.length ?? 0) === 0);

console.log(`\n${failures === 0 ? 'הכול עבר בהצלחה.' : `${failures} בדיקות נכשלו.`}\n`);
process.exit(failures === 0 ? 0 : 1);
