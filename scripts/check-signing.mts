/**
 * בדיקת קצה־אל־קצה של החתימה בשכבת הנתונים (B2 + טריגר A1):
 * כל משתתפי השרשרת של 4 חותמים "אישור הפגשה" → המעגל עובר ל-meeting_confirmed,
 * ולוג החשיפה מתמלא. חתימות הן append-only, ולכן ההרצה אידמפוטנטית (on conflict).
 *   npm run check:signing
 */
import { readFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { contentHash, renderTemplate } from '../src/lib/signing/render';

for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].trim(); }
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!, KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
let failures = 0;
const ok = (c: boolean, l: string, d = '') => { console.log(`${c ? '  ✓' : '  ✗'} ${l}${d ? ' — ' + d : ''}`); if (!c) failures++; };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function signIn(email: string): Promise<{ c: SupabaseClient; id: string }> {
  for (let i = 0; i < 5; i++) {
    const c = createClient(URL_, KEY, { auth: { persistSession: false } });
    const { data, error } = await c.auth.signInWithPassword({ email, password: 'Demo1234!' });
    if (data?.user) return { c, id: data.user.id };
    if (!error?.message.toLowerCase().includes('rate limit')) throw error;
    await sleep(5000 * (i + 1));
  }
  throw new Error('rate limit');
}

console.log('\n1) התבנית זמינה גם לאורח');
const guest = createClient(URL_, KEY, { auth: { persistSession: false } });
const { data: tpl } = await guest.from('document_templates').select('id, version, body_markdown').eq('kind', 'meeting_confirmation').order('version', { ascending: false }).limit(1).maybeSingle();
ok(!!tpl, 'תבנית אישור הפגשה קיימת', `v${tpl?.version}`);

console.log('\n2) השרשרת של 4 — לפני');
const { c: eran, id: eranId } = await signIn('eran@demo.swap.co.il');
const { data: chain } = await eran.from('matches').select('id, status, chain_listing_ids').eq('match_type', 'chain').order('created_at').limit(5);
const four = chain?.find((m) => m.chain_listing_ids.length === 4);
ok(!!four, 'נמצאה שרשרת של 4', four?.status);
if (!four || !tpl) process.exit(1);

const { data: owners } = await eran.from('listings').select('id, owner_id, city').in('id', four.chain_listing_ids);
const emails: Record<string, string> = {};
for (const n of ['eran', 'hadas', 'itai', 'maya']) { const { c, id } = await signIn(`${n}@demo.swap.co.il`); emails[id] = `${n}@demo.swap.co.il`; await c.auth.signOut(); }

console.log('\n3) כל משתתף חותם');
for (const o of owners ?? []) {
  const { c, id } = await signIn(emails[o.owner_id]);
  const text = renderTemplate(tpl.body_markdown, { full_name: emails[id], date: '2026-09-24', listings_block: four.chain_listing_ids.map((x) => `- ${x}`).join('\n') });
  const { error } = await c.from('signed_documents').insert({
    user_id: id, kind: 'meeting_confirmation', template_id: tpl.id, template_version: tpl.version,
    content_hash: contentHash(text), otp_verified: false, verification_method: 'none', related_match_id: four.id,
  });
  const dup = error?.code === '23505';
  ok(!error || dup, `חתימה של ${emails[id]}`, dup ? 'כבר חתום (אידמפוטנטי)' : error?.message ?? '');
  await c.auth.signOut();
}

console.log('\n4) אחרי — הטריגר');
const { data: after } = await eran.from('matches').select('status').eq('id', four.id).single();
ok(after?.status === 'meeting_confirmed', 'המעגל עבר ל-meeting_confirmed', after?.status);
const { data: exposures } = await eran.from('exposure_log').select('listing_id, level').eq('match_id', four.id).eq('viewer_user_id', eranId);
ok((exposures?.length ?? 0) === 3, 'ערן מתועד כמי שנחשף ל-3 הנכסים האחרים', `${exposures?.length}`);
const { data: revealed } = await eran.from('listings_view').select('id, street, is_revealed').in('id', four.chain_listing_ids);
ok(!!revealed && revealed.every((r) => r.is_revealed && r.street), 'הכתובות של כל המעגל נחשפו לערן ב-listings_view');

console.log('\n5) ראיות לא נמחקות');
const { data: mine } = await eran.from('signed_documents').select('id').eq('user_id', eranId).eq('related_match_id', four.id).limit(1).maybeSingle();
const { error: delErr } = await eran.from('signed_documents').delete().eq('id', mine!.id);
const { data: still } = await eran.from('signed_documents').select('id').eq('id', mine!.id).maybeSingle();
ok(!!still, 'מחיקת חתימה נחסמת (append-only / RLS)', delErr?.message ?? 'RLS: 0 שורות');

console.log(failures ? `\n${failures} נכשלו.` : '\nהכול עבר בהצלחה.');
process.exit(failures ? 1 : 0);
