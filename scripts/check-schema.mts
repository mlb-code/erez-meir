/**
 * בדיקת סכמה אחרי מיגרציה: views, הסתרת כתובות, הצפנת ת"ז, append-only.
 *   npm run check:schema
 */
import { readFileSync } from "node:fs";
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split('\n')) { const m=l.match(/^([A-Z_]+)=(.*)$/); if(m) process.env[m[1]] ??= m[2].trim(); }
const URL_=process.env.NEXT_PUBLIC_SUPABASE_URL!, KEY=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ok=(c:boolean,l:string,d='')=>console.log(`${c?'  ✓':'  ✗'} ${l}${d?' — '+d:''}`);

// 1) מבנה — ישירות במסד
const db=new pg.Client({host:process.env.SUPABASE_DB_HOST,port:5432,user:process.env.SUPABASE_DB_USER,password:process.env.SUPABASE_DB_PASSWORD,database:'postgres',ssl:{rejectUnauthorized:false}});
await db.connect();
const t=(await db.query(`select count(*)::int n from pg_tables where schemaname='public'`)).rows[0].n;
ok(t>=19,'טבלאות public',`${t}`);
const v=(await db.query(`select count(*)::int n from vault.secrets where name='id_number_key'`)).rows[0].n;
ok(v===1,'מפתח הצפנת ת"ז ב-Vault');
const vs=(await db.query(`select count(*)::int n from information_schema.views where table_schema='public' and table_name in ('listings_view','listing_photos_view')`)).rows[0].n;
ok(vs===2,'שני ה-views קיימים');
const st=(await db.query(`select unnest(enum_range(null::public.match_state))::text s`)).rows.map(r=>r.s);
ok(st.includes('meeting_confirmed')&&st.includes('expired'),'match_state הורחב',st.join(','));
// append-only
let guarded=false; try{ await db.query(`update public.audit_log set action='x' where false`); await db.query(`insert into public.audit_log(action,entity) values('t','t')`); await db.query(`delete from public.audit_log where action='t'`);}catch(e){guarded=String((e as Error).message).includes('append-only');}
ok(guarded,'audit_log חסום למחיקה (append-only)');
await db.query(`delete from public.audit_log where action='t'`).catch(()=>{});

// 2) חשיפה מדורגת — כמשתמש
const anon=createClient(URL_,KEY,{auth:{persistSession:false}});
const {data:g}=await anon.from('listings_view').select('id,street,house_number,is_revealed').limit(25);
ok((g?.length??0)===25,'אורח רואה 25 מודעות ב-listings_view',`${g?.length}`);
ok(!!g&&g.every(r=>r.street===null&&r.house_number===null&&r.is_revealed===false),'אורח: רחוב ומספר מוסתרים בכולן');

const eran=createClient(URL_,KEY,{auth:{persistSession:false}});
await eran.auth.signInWithPassword({email:'eran@demo.swap.co.il',password:'Demo1234!'});
const {data:e}=await eran.from('listings_view').select('id,street,is_revealed,owner_id');
const {data:{user}}=await eran.auth.getUser();
const mine=e!.filter(r=>r.owner_id===user!.id), revealed=e!.filter(r=>r.is_revealed&&r.owner_id!==user!.id), hidden=e!.filter(r=>!r.is_revealed);
ok(mine.every(r=>r.street!==null),'ערן רואה את הרחוב של עצמו');
ok(revealed.length===3&&revealed.every(r=>r.street!==null),'ערן רואה רחוב של 3 השותפים במעגל הפתוח',`${revealed.length}`);
ok(hidden.length>0&&hidden.every(r=>r.street===null),'שאר המודעות — רחוב מוסתר',`${hidden.length}`);

// 3) submit_identity — ספרת ביקורת
const {error:bad}=await eran.rpc('submit_identity',{p_id_number:'123456789',p_birth_date:'1980-01-01'});
ok(!!bad&&bad.message.includes('אינו תקין'),'ת"ז לא תקינה נדחית');
const {error:good}=await eran.rpc('submit_identity',{p_id_number:'000000018',p_birth_date:'1980-01-01'});
ok(!good,'ת"ז תקינה (ספרת ביקורת) מתקבלת', good?.message);
const {data:p}=await eran.from('profiles').select('id_number_last4,identity_status,id_number_enc').eq('id',user!.id).single();
ok(p?.id_number_last4==='0018'&&p?.identity_status==='verified','נשמר מוצפן, 4 ספרות אחרונות, סטטוס נשמר verified',`${p?.identity_status}`);
ok(typeof p?.id_number_enc==='string'&&!(p!.id_number_enc as string).includes('000000018'),'המספר המלא לא נקרא מהעמודה');
await db.query(`update public.profiles set id_number_enc=null,id_number_last4=null,birth_date=null where id=$1`,[user!.id]);
await db.end();
