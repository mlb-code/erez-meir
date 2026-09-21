-- ===========================================================================
-- 003 — סכמת שלב 1 לפי איפיון v1.0 (חבילה A1)
-- מרחיב את הבסיס (001) בלי לשבור את האפליקציה הקיימת: כל העמודות החדשות
-- אופציונליות או עם ברירת מחדל, ושום עמודה קיימת לא משנה שם.
--
-- סטיות מהאיפיון (מתועדות גם ב-SPEC §0.3):
--  • asking_value נשאר בשם הזה ומשמעותו "השווי המוצהר". לא הוספנו declared_value.
--  • ops מזוהה לפי profiles.account_type = 'ops' (ולא claim ב-JWT). נקבע רק ב-SQL.
--  • כלל פתיחת הצ'אט וחשיפת פרופיל הוא *מעברי*: כולל all_interested עד שחבילה D4
--    תבנה את זרימת אישור ההפגשה. אז מסירים את all_interested מהרשימה.
--  • הסתרת עמודות (רחוב, מספר בית, גוש/חלקה) נעשית דרך views. ביטול SELECT ישיר
--    על listings ל-authenticated יתבצע בשער 2, אחרי שהאפליקציה עוברת ל-views.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. עזרים
-- ---------------------------------------------------------------------------
-- plpgsql במכוון: העמודה account_type נוספת רק בסעיף 3, ופונקציית sql הייתה נבדקת כבר עכשיו.
create or replace function private.is_ops()
returns boolean language plpgsql security definer stable set search_path = public as $$
begin
  return exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'ops');
end;
$$;

-- מצבים שבהם המעגל "פתוח": כתובות, שמות, טלפונים וצ'אט.
-- מעברי: all_interested נשאר עד D4.
create or replace function private.open_match_states()
returns public.match_state[] language sql immutable as $$
  select array['all_interested','meeting_confirmed','in_negotiation','closing','swapped']::public.match_state[];
$$;

create or replace function private.match_is_open_for_chat(p_match uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match and m.status = any(private.open_match_states())
  );
$$;

create or replace function private.shares_open_match_with(p_user uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.matches m
    join public.listings mine on mine.id = any(m.chain_listing_ids) and mine.owner_id = auth.uid()
    join public.listings theirs on theirs.id = any(m.chain_listing_ids) and theirs.owner_id = p_user
    where m.status = any(private.open_match_states())
  );
$$;

-- האם נכס נחשף אליי במלואו (כתובת מדויקת): משתתף במעגל פתוח שהנכס בו, או הבעלים, או ops.
create or replace function private.is_revealed_to_me(p_listing uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select private.is_ops()
    or exists (select 1 from public.listings l where l.id = p_listing and l.owner_id = auth.uid())
    or exists (
      select 1
      from public.matches m
      join public.listings mine on mine.id = any(m.chain_listing_ids) and mine.owner_id = auth.uid()
      where p_listing = any(m.chain_listing_ids)
        and m.status = any(private.open_match_states())
    );
$$;

-- טבלאות ראיות — אסור לשנות או למחוק, לאף אחד.
create or replace function private.forbid_change()
returns trigger language plpgsql as $$
begin
  raise exception 'הטבלה % היא append-only: אין עדכון ואין מחיקה', tg_table_name;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. שכונות
-- ---------------------------------------------------------------------------
create table public.neighborhoods (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  name text not null,
  sort_order integer not null default 0,
  polygon jsonb,                      -- GeoJSON, שלב 3
  created_at timestamptz not null default now(),
  unique (city, name)
);
create index neighborhoods_city_idx on public.neighborhoods (city, sort_order);

-- ---------------------------------------------------------------------------
-- 3. profiles — זהות, סוג חשבון, מתווך
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column account_type public.account_type not null default 'owner',
  add column id_number_enc bytea,                 -- מספר ת"ז מוצפן (pgcrypto, מפתח ב-Vault)
  add column id_number_last4 text,                -- לתצוגה בלבד
  add column birth_date date,
  add column phone_verified_at timestamptz,
  add column identity_status public.identity_status not null default 'pending',
  add column identity_reviewed_by uuid references public.profiles(id),
  add column identity_reviewed_at timestamptz,
  add column identity_reject_reason text,
  add column broker_license_no text,
  add column is_verified_badge boolean not null default false,
  add column terms_signed_at timestamptz,
  add column updated_at timestamptz not null default now();

create trigger profiles_touch_updated_at
  before update on public.profiles for each row execute function public.touch_updated_at();

-- הצפנת ת"ז: המפתח נשמר ב-Supabase Vault תחת השם id_number_key.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'id_number_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'id_number_key', 'מפתח הצפנה למספרי תעודת זהות');
  end if;
end $$;

create or replace function private.encrypt_id(p_id text)
returns bytea language sql security definer stable set search_path = public as $$
  select extensions.pgp_sym_encrypt(p_id, (select decrypted_secret from vault.decrypted_secrets where name = 'id_number_key'));
$$;

create or replace function private.decrypt_id(p_enc bytea)
returns text language sql security definer stable set search_path = public as $$
  select extensions.pgp_sym_decrypt(p_enc, (select decrypted_secret from vault.decrypted_secrets where name = 'id_number_key'));
$$;

-- המשתמש מגיש ת"ז: המספר נשמר מוצפן, המשתמש עצמו לא קורא אותו בחזרה.
create or replace function public.submit_identity(p_id_number text, p_birth_date date)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_digits text := regexp_replace(coalesce(p_id_number, ''), '\D', '', 'g');
  v_sum integer := 0; v_d integer; v_i integer;
begin
  if auth.uid() is null then raise exception 'נדרשת התחברות'; end if;
  if length(v_digits) <> 9 then raise exception 'מספר תעודת זהות חייב להכיל 9 ספרות'; end if;
  -- ספרת ביקורת (אלגוריתם לוהן ישראלי)
  for v_i in 1..9 loop
    v_d := substr(v_digits, v_i, 1)::integer * (case when v_i % 2 = 1 then 1 else 2 end);
    if v_d > 9 then v_d := v_d - 9; end if;
    v_sum := v_sum + v_d;
  end loop;
  if v_sum % 10 <> 0 then raise exception 'מספר תעודת הזהות אינו תקין'; end if;

  update public.profiles
     set id_number_enc = private.encrypt_id(v_digits),
         id_number_last4 = right(v_digits, 4),
         birth_date = p_birth_date,
         identity_status = case when identity_status = 'verified' then 'verified' else 'submitted' end
   where id = auth.uid();
end;
$$;
revoke all on function public.submit_identity(text, date) from public, anon;
grant execute on function public.submit_identity(text, date) to authenticated;

-- ops קורא ת"ז מפוענח לצורך הבדיקה
create or replace function public.ops_read_id_number(p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not private.is_ops() then raise exception 'הרשאת תפעול נדרשת'; end if;
  insert into public.audit_log (actor_id, action, entity, entity_id) values (auth.uid(), 'read_id_number', 'profiles', p_user);
  return (select private.decrypt_id(id_number_enc) from public.profiles where id = p_user);
end;
$$;
revoke all on function public.ops_read_id_number(uuid) from public, anon;
grant execute on function public.ops_read_id_number(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. listings — סוג נכס, זיהוי, משפטי, זמן, מבוקש מורחב
-- ---------------------------------------------------------------------------
alter table public.listings
  add column asset_type public.asset_type not null default 'apartment',
  add column neighborhood_id uuid references public.neighborhoods(id),
  add column house_number text,                   -- פרטי, נחשף רק אחרי אישור הפגשה
  add column gush integer,
  add column helka integer,
  add column tat_helka integer,
  add column right_type public.right_type not null default 'ownership',
  add column lease_contract_no text,
  add column has_mortgage boolean not null default false,
  add column mortgage_balance bigint check (mortgage_balance is null or mortgage_balance >= 0),
  add column has_caveats boolean not null default false,
  add column has_liens boolean not null default false,
  add column has_tenant boolean not null default false,
  add column tenant_lease_ends date,
  add column available_from date,
  add column available_until date,
  add column availability_flex_months smallint not null default 0 check (availability_flex_months between 0 and 12),
  add column parking_count smallint not null default 0 check (parking_count between 0 and 10),
  add column has_storage boolean not null default false,
  add column commercial_use text,
  add column annual_yield numeric(5,2),
  add column land_zoning text,
  add column building_rights_sqm integer,
  add column ownership_status public.ownership_status,
  add column ownership_declared_all_owners boolean not null default false,
  add column avm_value bigint,
  add column avm_updated_at timestamptz,
  add column wanted_asset_types public.asset_type[] not null default array['apartment']::public.asset_type[],
  add column wanted_neighborhood_ids uuid[] not null default '{}',
  add column wanted_min_floor smallint,
  add column wanted_value_min bigint,
  add column wanted_value_max bigint,
  add column wanted_available_from date,
  add column wanted_available_until date,
  add column soft_prefs jsonb not null default '{}',
  add column broker_id uuid references public.profiles(id),
  add column locked_until timestamptz,
  add column exclusivity_match_id uuid;

comment on column public.listings.asking_value is 'השווי המוצהר על ידי המשתמש (declared value). ההתאמה רצה עליו; avm_value הוא אומדן בלבד.';
comment on column public.listings.soft_prefs is 'העדפות רכות 0–3: {"elevator":2,"parking":3,"balcony":1,"safe_room":0,"new_building":1,"renovated":2,"urban_renewal":0}';

create index listings_neighborhood_idx on public.listings (neighborhood_id);
create index listings_parcel_idx on public.listings (gush, helka, tat_helka);
create index listings_broker_idx on public.listings (broker_id);
create index listings_wanted_nb_gin on public.listings using gin (wanted_neighborhood_ids);

-- תאימות: מודעות הדמו הפעילות נחשבות מאומתות (לפני האילוץ שלמטה)
update public.listings set ownership_status = 'approved' where status = 'active' and ownership_status is null;
-- מודעה פעילה חייבת חלקה ואישור בעלות
alter table public.listings
  add constraint listings_active_requires_ownership
  check (status <> 'active' or ownership_status = 'approved');

alter table public.listing_photos
  add column is_exterior boolean not null default false;

-- ---------------------------------------------------------------------------
-- 5. matches — ציון לכל צד, בלעדיות
-- ---------------------------------------------------------------------------
alter table public.matches
  add column scores jsonb not null default '{}',   -- {listing_id: 0-100}
  add column estimated_close_probability numeric(4,3) check (estimated_close_probability between 0 and 1),
  add column negotiation_started_at timestamptz,
  add column negotiation_expires_at timestamptz;

-- ---------------------------------------------------------------------------
-- 6. טבלאות חדשות
-- ---------------------------------------------------------------------------
create table public.identity_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'id_front' check (kind in ('id_front','id_back','selfie')),
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  decision public.review_decision,
  reason text,
  purge_after timestamptz                       -- 30 יום אחרי אישור — נמחק (E7)
);
create index identity_documents_user_idx on public.identity_documents (user_id);

create table public.ownership_verifications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  document_date date,
  extracted jsonb not null default '{}',       -- מה שחולץ מהנסח
  declared jsonb not null default '{}',        -- מה שהמשתמש הצהיר
  status public.ownership_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ownership_verifications_listing_idx on public.ownership_verifications (listing_id, created_at desc);
create trigger ownership_verifications_touch before update on public.ownership_verifications
  for each row execute function public.touch_updated_at();

create table public.document_templates (
  id uuid primary key default gen_random_uuid(),
  kind public.document_kind not null,
  version integer not null,
  title text not null,
  body_markdown text not null,
  effective_from timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (kind, version)
);

-- חבילת הראיות: כל חתימה שורה. append-only.
create table public.signed_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  kind public.document_kind not null,
  template_id uuid references public.document_templates(id),
  template_version integer,
  content_hash text not null,                   -- SHA-256 של הטקסט שהוצג
  signed_at timestamptz not null default now(),
  ip inet,
  user_agent text,
  otp_verified boolean not null default false,
  related_match_id uuid references public.matches(id) on delete restrict,
  related_listing_id uuid references public.listings(id) on delete restrict
);
create index signed_documents_user_idx on public.signed_documents (user_id, kind);
create index signed_documents_match_idx on public.signed_documents (related_match_id) where related_match_id is not null;
create trigger signed_documents_append_only before update or delete on public.signed_documents
  for each row execute function private.forbid_change();

-- מי ראה מה ומתי. append-only.
create table public.exposure_log (
  id bigint generated always as identity primary key,
  viewer_user_id uuid not null references public.profiles(id) on delete restrict,
  listing_id uuid not null references public.listings(id) on delete restrict,
  match_id uuid references public.matches(id) on delete restrict,
  level public.exposure_level not null,
  at timestamptz not null default now()
);
create index exposure_log_listing_idx on public.exposure_log (listing_id, at desc);
create index exposure_log_viewer_idx on public.exposure_log (viewer_user_id, at desc);
create trigger exposure_log_append_only before update or delete on public.exposure_log
  for each row execute function private.forbid_change();

-- סגירה + עמלה + חשבונית, שורה לכל צד
create table public.closings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete restrict,
  listing_id uuid not null references public.listings(id) on delete restrict,
  reported_by uuid not null references public.profiles(id),
  signed_on date not null,
  agreement_path text,
  reported_at timestamptz not null default now(),
  reported_within_14_days boolean not null default false,   -- נקבע בפעולת הדיווח (המרה מ-timestamptz לתאריך אינה immutable)
  fee_rate numeric(5,4) not null default 0.005,  -- 0.5% ; 0.0045 לדיווח בזמן
  fee_base_value bigint not null,                -- שווי הנכס שהצד מסר
  fee_amount bigint not null,
  vat_rate numeric(4,3) not null default 0.18,
  vat_amount bigint not null,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  invoice_number text,
  invoice_path text,
  invoice_sent_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (match_id, listing_id)
);
create trigger closings_touch before update on public.closings for each row execute function public.touch_updated_at();

-- עסקאות ציבוריות (רשות המסים / נדל"ן ממשלתי) — בסיס לסורק ול-AVM
create table public.public_transactions (
  id bigint generated always as identity primary key,
  gush integer,
  helka integer,
  tat_helka integer,
  city text,
  street text,
  house_number text,
  sale_date date not null,
  price bigint not null,
  area_sqm numeric(8,2),
  rooms numeric(3,1),
  floor integer,
  asset_kind text,
  source text not null,                          -- 'nadlan_gov_csv' / 'manual' / ...
  source_row_hash text not null unique,          -- אידמפוטנטיות ביבוא
  imported_at timestamptz not null default now()
);
create index public_transactions_parcel_idx on public.public_transactions (gush, helka, tat_helka, sale_date desc);
create index public_transactions_city_idx on public.public_transactions (city, sale_date desc);

create table public.scan_alerts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete restrict,
  public_transaction_id bigint references public.public_transactions(id),
  match_id uuid references public.matches(id) on delete restrict,
  matched_by text not null,                      -- 'gush_helka' / 'address'
  counterpart_also_sold boolean not null default false,
  status public.scan_alert_status not null default 'new',
  handled_by uuid references public.profiles(id),
  handled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index scan_alerts_status_idx on public.scan_alerts (status, created_at desc);
create trigger scan_alerts_touch before update on public.scan_alerts for each row execute function public.touch_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel public.notification_channel not null,
  template text not null,
  payload jsonb not null default '{}',
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  status public.notification_status not null default 'queued',
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);
create index notifications_queue_idx on public.notifications (status, scheduled_for) where status = 'queued';
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.brokers_clients (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.profiles(id) on delete cascade,
  client_user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  consent_document_id uuid references public.signed_documents(id),
  created_at timestamptz not null default now(),
  unique (broker_id, client_user_id, listing_id)
);

create table public.tax_simulations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete restrict,
  listing_id uuid not null references public.listings(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  inputs jsonb not null,
  outputs jsonb not null,
  rules_version text not null,
  computed_at timestamptz not null default now()
);
create index tax_simulations_match_idx on public.tax_simulations (match_id, listing_id);

-- append-only
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id, at desc);
create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function private.forbid_change();

-- ---------------------------------------------------------------------------
-- 7. טריגרים על זרימת המעגל
-- ---------------------------------------------------------------------------
-- עדכון סטטוס לפי תגובות — בלי להוריד מעגל שכבר עבר לאישור הפגשה
create or replace function public.sync_match_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_total integer; v_yes integer; v_no integer; v_status public.match_state;
begin
  select coalesce(array_length(chain_listing_ids, 1), 0), status into v_total, v_status
  from public.matches where id = new.match_id;

  select count(*) filter (where response = 'interested'),
         count(*) filter (where response = 'not_interested')
  into v_yes, v_no from public.match_responses where match_id = new.match_id;

  if v_status in ('closing', 'swapped', 'expired') then
    return new;                                   -- מעגל שנסגר לא משתנה מתגובות
  elsif v_no > 0 then
    update public.matches set status = 'dismissed' where id = new.match_id;
  elsif v_status in ('meeting_confirmed', 'in_negotiation') then
    return new;                                   -- כבר מעבר לשלב התגובות
  elsif v_total > 0 and v_yes >= v_total then
    update public.matches set status = 'all_interested' where id = new.match_id;
  elsif v_yes > 0 then
    update public.matches set status = 'interested_partial' where id = new.match_id;
  else
    update public.matches set status = 'suggested' where id = new.match_id;
  end if;
  return new;
end;
$$;

-- כשכל משתתפי המעגל חתמו על אישור הפגשה — המעגל נפתח
create or replace function private.on_meeting_confirmation()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ids uuid[]; v_needed integer; v_signed integer;
begin
  if new.kind <> 'meeting_confirmation' or new.related_match_id is null then return new; end if;
  select chain_listing_ids into v_ids from public.matches where id = new.related_match_id;
  v_needed := coalesce(array_length(v_ids, 1), 0);
  select count(distinct l.owner_id) into v_signed
  from public.signed_documents sd
  join public.listings l on l.owner_id = sd.user_id and l.id = any(v_ids)
  where sd.related_match_id = new.related_match_id and sd.kind = 'meeting_confirmation';
  if v_needed > 0 and v_signed >= v_needed then
    update public.matches set status = 'meeting_confirmed'
     where id = new.related_match_id and status = 'all_interested';
    -- תיעוד חשיפה מלאה לכל המשתתפים
    insert into public.exposure_log (viewer_user_id, listing_id, match_id, level)
    select l_viewer.owner_id, l_seen.id, new.related_match_id, 'full'
    from public.listings l_viewer, public.listings l_seen
    where l_viewer.id = any(v_ids) and l_seen.id = any(v_ids) and l_viewer.id <> l_seen.id;
  end if;
  return new;
end;
$$;
create trigger signed_documents_meeting_confirmation after insert on public.signed_documents
  for each row execute function private.on_meeting_confirmation();

-- ---------------------------------------------------------------------------
-- 8. Views לחשיפה מדורגת (security definer — הסינון בתוך ה-view)
-- ---------------------------------------------------------------------------
create or replace view public.listings_view
with (security_invoker = false) as
select
  l.id, l.owner_id, l.status, l.asset_type, l.city, l.neighborhood, l.neighborhood_id,
  case when private.is_revealed_to_me(l.id) then l.street else null end as street,
  case when private.is_revealed_to_me(l.id) then l.house_number else null end as house_number,
  case when private.is_revealed_to_me(l.id) then l.gush else null end as gush,
  case when private.is_revealed_to_me(l.id) then l.helka else null end as helka,
  case when private.is_revealed_to_me(l.id) then l.tat_helka else null end as tat_helka,
  l.rooms, l.size_sqm, l.floor, l.total_floors, l.has_elevator, l.has_parking, l.parking_count,
  l.has_balcony, l.has_safe_room, l.has_storage, l.building_year, l.condition, l.urban_renewal_status,
  l.right_type, l.has_mortgage, l.has_caveats, l.has_liens, l.has_tenant, l.tenant_lease_ends,
  l.available_from, l.available_until, l.availability_flex_months,
  l.commercial_use, l.annual_yield, l.land_zoning, l.building_rights_sqm,
  l.asking_value, l.avm_value, l.avm_updated_at, l.description,
  l.wanted_asset_types, l.wanted_cities, l.wanted_neighborhood_ids, l.wanted_min_rooms, l.wanted_max_rooms,
  l.wanted_min_sqm, l.wanted_min_floor, l.wanted_value_min, l.wanted_value_max,
  l.wanted_available_from, l.wanted_available_until, l.must_haves, l.soft_prefs,
  l.cash_add_max, l.cash_receive_min, l.ownership_status, l.broker_id, l.locked_until,
  l.created_at, l.updated_at,
  private.is_revealed_to_me(l.id) as is_revealed
from public.listings l
where l.status = 'active'
   or l.owner_id = auth.uid()
   or private.listing_shares_match(l.id)
   or private.is_ops();

create or replace view public.listing_photos_view
with (security_invoker = false) as
select p.id, p.listing_id, p.storage_path, p.sort_order, p.is_exterior
from public.listing_photos p
join public.listings l on l.id = p.listing_id
where private.can_view_listing(p.listing_id)
  and (not p.is_exterior or private.is_revealed_to_me(p.listing_id));

grant select on public.listings_view, public.listing_photos_view to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. RLS
-- ---------------------------------------------------------------------------
alter table public.neighborhoods           enable row level security;
alter table public.identity_documents      enable row level security;
alter table public.ownership_verifications enable row level security;
alter table public.document_templates      enable row level security;
alter table public.signed_documents        enable row level security;
alter table public.exposure_log            enable row level security;
alter table public.closings                enable row level security;
alter table public.public_transactions     enable row level security;
alter table public.scan_alerts             enable row level security;
alter table public.notifications           enable row level security;
alter table public.brokers_clients         enable row level security;
alter table public.tax_simulations         enable row level security;
alter table public.audit_log               enable row level security;

create policy "neighborhoods: קריאה לכולם" on public.neighborhoods for select to anon, authenticated using (true);

create policy "identity_documents: שלי או ops" on public.identity_documents for select to authenticated
  using (user_id = auth.uid() or private.is_ops());
create policy "identity_documents: העלאה בשם עצמי" on public.identity_documents for insert to authenticated
  with check (user_id = auth.uid());
create policy "identity_documents: ops מעדכן" on public.identity_documents for update to authenticated
  using (private.is_ops()) with check (private.is_ops());

create policy "ownership: הבעלים או ops" on public.ownership_verifications for select to authenticated
  using (private.owns_listing(listing_id) or private.is_ops());
create policy "ownership: הבעלים מגיש" on public.ownership_verifications for insert to authenticated
  with check (private.owns_listing(listing_id));
create policy "ownership: ops מחליט" on public.ownership_verifications for update to authenticated
  using (private.is_ops()) with check (private.is_ops());

create policy "templates: קריאה לכולם" on public.document_templates for select to anon, authenticated using (true);

create policy "signed: שלי או ops" on public.signed_documents for select to authenticated
  using (user_id = auth.uid() or private.is_ops());
create policy "signed: חותם בשם עצמי" on public.signed_documents for insert to authenticated
  with check (user_id = auth.uid());

create policy "exposure: שלי או ops" on public.exposure_log for select to authenticated
  using (viewer_user_id = auth.uid() or private.is_ops());
create policy "exposure: רישום בשם עצמי" on public.exposure_log for insert to authenticated
  with check (viewer_user_id = auth.uid());

create policy "closings: משתתפים או ops" on public.closings for select to authenticated
  using (private.is_match_participant(match_id) or private.is_ops());
create policy "closings: דיווח על הנכס שלי" on public.closings for insert to authenticated
  with check (reported_by = auth.uid() and private.owns_listing(listing_id) and private.is_match_participant(match_id));
create policy "closings: ops מאשר ומפיק" on public.closings for update to authenticated
  using (private.is_ops()) with check (private.is_ops());

create policy "public_transactions: קריאה למחוברים" on public.public_transactions for select to authenticated using (true);

create policy "scan_alerts: ops בלבד" on public.scan_alerts for all to authenticated
  using (private.is_ops()) with check (private.is_ops());

create policy "notifications: שלי או ops" on public.notifications for select to authenticated
  using (user_id = auth.uid() or private.is_ops());

create policy "brokers_clients: צדדים או ops" on public.brokers_clients for select to authenticated
  using (broker_id = auth.uid() or client_user_id = auth.uid() or private.is_ops());
create policy "brokers_clients: מתווך מוסיף" on public.brokers_clients for insert to authenticated
  with check (broker_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'broker'));

create policy "tax_simulations: משתתפים או ops" on public.tax_simulations for select to authenticated
  using (private.is_match_participant(match_id) or private.is_ops());
create policy "tax_simulations: שמירה בשם עצמי" on public.tax_simulations for insert to authenticated
  with check (user_id = auth.uid() and private.is_match_participant(match_id));

create policy "audit: ops בלבד" on public.audit_log for select to authenticated using (private.is_ops());

-- מתווך: יכול ליצור ולערוך מודעות של לקוחותיו (בנוסף למדיניות הבעלים הקיימת)
create policy "listings: מתווך רואה את מודעות לקוחותיו" on public.listings for select to authenticated
  using (broker_id = auth.uid());
create policy "listings: מתווך עורך את מודעות לקוחותיו" on public.listings for update to authenticated
  using (broker_id = auth.uid()) with check (broker_id = auth.uid());
create policy "listings: ops רואה הכול" on public.listings for select to authenticated
  using (private.is_ops());
create policy "profiles: ops רואה הכול" on public.profiles for select to authenticated
  using (private.is_ops());
create policy "profiles: ops מעדכן זהות" on public.profiles for update to authenticated
  using (private.is_ops()) with check (private.is_ops());
create policy "matches: ops רואה הכול" on public.matches for select to authenticated
  using (private.is_ops());

-- ---------------------------------------------------------------------------
-- 10. אחסון: דליים פרטיים
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('identity-docs',  'identity-docs',  false, 8388608,  array['image/jpeg','image/png','application/pdf']),
  ('ownership-docs', 'ownership-docs', false, 10485760, array['application/pdf','image/jpeg','image/png']),
  ('agreements',     'agreements',     false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

create policy "private buckets: העלאה לתיקייה האישית" on storage.objects for insert to authenticated
  with check (bucket_id in ('identity-docs','ownership-docs','agreements') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "private buckets: קריאה — שלי או ops" on storage.objects for select to authenticated
  using (bucket_id in ('identity-docs','ownership-docs','agreements') and ((storage.foldername(name))[1] = auth.uid()::text or private.is_ops()));

-- ---------------------------------------------------------------------------
-- 11. תאימות לנתונים קיימים: מודעות פעילות מהדמו נחשבות מאומתות
-- ---------------------------------------------------------------------------
update public.profiles set identity_status = 'verified', phone_verified_at = now(), terms_signed_at = now()
  where id in (select owner_id from public.listings where status = 'active');
