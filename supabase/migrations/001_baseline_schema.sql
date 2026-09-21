-- ===========================================================================
--  החלפה — סכמה מלאה, הרשאות RLS, טריגרים ואחסון
--  להרצה על פרויקט Supabase ריק, דרך SQL Editor בדשבורד.
--  אחרי הקובץ הזה מריצים את seed.sql כדי לקבל את נתוני ההדגמה.
-- ===========================================================================

-- ===== טיפוסים =====
create type public.listing_status as enum ('draft','active','in_negotiation','swapped','archived');
create type public.property_condition as enum ('new','renovated','maintained','needs_renovation','pre_urban_renewal');
create type public.urban_renewal_type as enum ('none','tama38_planned','tama38_approved','pinui_binui_planned','pinui_binui_approved');
create type public.property_feature as enum ('elevator','parking','balcony','safe_room','renovated');
create type public.match_kind as enum ('direct','chain');
create type public.match_state as enum ('suggested','interested_partial','all_interested','dismissed');
create type public.response_kind as enum ('interested','not_interested');

-- ===== profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ===== listings =====
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status public.listing_status not null default 'draft',

  -- מה יש לי
  city text not null,
  neighborhood text,
  street text,
  rooms numeric(3,1) not null check (rooms > 0 and rooms <= 20),
  size_sqm integer not null check (size_sqm > 0),
  floor integer,
  total_floors integer,
  has_elevator boolean not null default false,
  has_parking boolean not null default false,
  has_balcony boolean not null default false,
  has_safe_room boolean not null default false,
  building_year integer,
  condition public.property_condition not null default 'maintained',
  urban_renewal_status public.urban_renewal_type not null default 'none',
  -- null מותר רק בטיוטה. אילוץ בהמשך הקובץ מחייב שווי במודעה פעילה.
  asking_value bigint check (asking_value > 0),
  description text,

  -- מה אני מחפש
  wanted_cities text[] not null default '{}',
  wanted_min_rooms numeric(3,1),
  wanted_max_rooms numeric(3,1),
  wanted_min_sqm integer,
  must_haves public.property_feature[] not null default '{}',

  -- גמישות מזומן
  cash_add_max bigint not null default 0 check (cash_add_max >= 0),
  cash_receive_min bigint not null default 0 check (cash_receive_min >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint listings_active_requires_value
    check (status <> 'active' or (asking_value is not null and asking_value > 0)),
  constraint listings_active_requires_wanted_city
    check (status <> 'active' or coalesce(array_length(wanted_cities, 1), 0) >= 1)
);

create index listings_status_idx on public.listings (status);
create index listings_city_idx on public.listings (city);
create index listings_owner_idx on public.listings (owner_id);
create index listings_value_idx on public.listings (asking_value);

-- ===== listing_photos =====
create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index listing_photos_listing_idx on public.listing_photos (listing_id, sort_order);

-- ===== matches =====
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  match_type public.match_kind not null,
  -- מערך מסודר: המשתתף i עובר לדירה של i+1, והאחרון לדירה של הראשון.
  -- מנורמל כך שהמזהה הקטן ביותר ראשון, כדי שאותו מעגל לא יישמר פעמיים.
  chain_listing_ids uuid[] not null,
  score integer not null default 0 check (score between 0 and 100),
  status public.match_state not null default 'suggested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_cycle_unique unique (chain_listing_ids),
  constraint matches_cycle_len check (array_length(chain_listing_ids, 1) between 2 and 5)
);
create index matches_chain_gin_idx on public.matches using gin (chain_listing_ids);
create index matches_status_idx on public.matches (status);

-- ===== match_responses =====
create table public.match_responses (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  response public.response_kind not null,
  responded_at timestamptz not null default now(),
  constraint match_responses_unique unique (match_id, listing_id)
);
create index match_responses_match_idx on public.match_responses (match_id);

-- ===== messages =====
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);
create index messages_match_idx on public.messages (match_id, created_at);


-- ===========================================================================
--  פונקציות עזר ל-RLS
-- ===========================================================================
--  security definer, כדי למנוע רקורסיה של RLS.
--  יושבות בסכמה `private` ולא ב-`public`, כי PostgREST חושף רק את public —
--  וכך אי אפשר לקרוא להן ישירות דרך ה-API מבחוץ.
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.owns_listing(p_listing uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.listings l
    where l.id = p_listing and l.owner_id = auth.uid()
  );
$$;

create or replace function private.is_match_participant(p_match uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.matches m
    join public.listings l on l.id = any(m.chain_listing_ids)
    where m.id = p_match and l.owner_id = auth.uid()
  );
$$;

create or replace function private.match_is_open_for_chat(p_match uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match and m.status = 'all_interested'
  );
$$;

create or replace function private.listing_shares_match(p_listing uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.matches m
    join public.listings mine on mine.id = any(m.chain_listing_ids) and mine.owner_id = auth.uid()
    where p_listing = any(m.chain_listing_ids)
  );
$$;

create or replace function private.can_view_listing(p_listing uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.listings l
    where l.id = p_listing
      and (l.status = 'active' or l.owner_id = auth.uid())
  ) or private.listing_shares_match(p_listing);
$$;

-- פרטי קשר נחשפים רק כששני הצדדים באותה התאמה שכולם אישרו
create or replace function private.shares_open_match_with(p_user uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.matches m
    join public.listings mine on mine.id = any(m.chain_listing_ids) and mine.owner_id = auth.uid()
    join public.listings theirs on theirs.id = any(m.chain_listing_ids) and theirs.owner_id = p_user
    where m.status = 'all_interested'
  );
$$;


-- ===========================================================================
--  RLS
-- ===========================================================================

alter table public.profiles        enable row level security;
alter table public.listings        enable row level security;
alter table public.listing_photos  enable row level security;
alter table public.matches         enable row level security;
alter table public.match_responses enable row level security;
alter table public.messages        enable row level security;

-- profiles
create policy "profiles: קריאה של עצמי או של שותף להתאמה פתוחה"
  on public.profiles for select to authenticated
  using (id = auth.uid() or private.shares_open_match_with(id));

create policy "profiles: יצירה של עצמי בלבד"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "profiles: עדכון של עצמי בלבד"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- listings — מודעות פעילות גלויות לכולם, גם למי שלא מחובר.
-- פרטי הקשר יושבים ב-profiles ונשארים מוגנים.
create policy "listings: מודעות פעילות גלויות לכולם"
  on public.listings for select to anon, authenticated
  using (status = 'active');

create policy "listings: הבעלים רואה את כל המודעות שלו"
  on public.listings for select to authenticated
  using (owner_id = auth.uid());

create policy "listings: מודעות שנמצאות בהתאמה שלי גלויות לי"
  on public.listings for select to authenticated
  using (private.listing_shares_match(id));

create policy "listings: יצירה רק בשם עצמי"
  on public.listings for insert to authenticated
  with check (owner_id = auth.uid());

create policy "listings: עריכה רק של המודעות שלי"
  on public.listings for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "listings: מחיקה רק של המודעות שלי"
  on public.listings for delete to authenticated
  using (owner_id = auth.uid());

-- listing_photos
create policy "photos: תמונות של מודעות שמותר לי לראות"
  on public.listing_photos for select to anon, authenticated
  using (private.can_view_listing(listing_id));

create policy "photos: הוספה רק למודעות שלי"
  on public.listing_photos for insert to authenticated
  with check (private.owns_listing(listing_id));

create policy "photos: עדכון רק במודעות שלי"
  on public.listing_photos for update to authenticated
  using (private.owns_listing(listing_id)) with check (private.owns_listing(listing_id));

create policy "photos: מחיקה רק מהמודעות שלי"
  on public.listing_photos for delete to authenticated
  using (private.owns_listing(listing_id));

-- matches
create policy "matches: רק משתתפים במעגל"
  on public.matches for select to authenticated
  using (private.is_match_participant(id));

-- match_responses
create policy "responses: קריאה למשתתפים במעגל"
  on public.match_responses for select to authenticated
  using (private.is_match_participant(match_id));

create policy "responses: כל אחד עונה רק בשם המודעה שלו"
  on public.match_responses for insert to authenticated
  with check (private.is_match_participant(match_id) and private.owns_listing(listing_id));

create policy "responses: עדכון תגובה משלי"
  on public.match_responses for update to authenticated
  using (private.owns_listing(listing_id))
  with check (private.is_match_participant(match_id) and private.owns_listing(listing_id));

-- messages
create policy "messages: קריאה רק כשכולם אישרו"
  on public.messages for select to authenticated
  using (private.is_match_participant(match_id) and private.match_is_open_for_chat(match_id));

create policy "messages: שליחה רק כשכולם אישרו"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and private.is_match_participant(match_id)
    and private.match_is_open_for_chat(match_id)
  );


-- ===========================================================================
--  טריגרים
-- ===========================================================================

-- יצירת פרופיל אוטומטית לכל משתמש חדש
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_touch_updated_at
  before update on public.listings
  for each row execute function public.touch_updated_at();

create trigger matches_touch_updated_at
  before update on public.matches
  for each row execute function public.touch_updated_at();

-- עד 10 תמונות למודעה
create or replace function public.enforce_photo_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.listing_photos where listing_id = new.listing_id;
  if v_count >= 10 then
    raise exception 'ניתן להעלות עד 10 תמונות למודעה';
  end if;
  return new;
end;
$$;

create trigger listing_photos_limit
  before insert on public.listing_photos
  for each row execute function public.enforce_photo_limit();

-- עדכון סטטוס ההתאמה לפי התגובות. כשכולם סימנו "מעוניין" — הצ'אט נפתח.
create or replace function public.sync_match_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_total integer;
  v_yes integer;
  v_no integer;
begin
  select coalesce(array_length(chain_listing_ids, 1), 0) into v_total
  from public.matches where id = new.match_id;

  select
    count(*) filter (where response = 'interested'),
    count(*) filter (where response = 'not_interested')
  into v_yes, v_no
  from public.match_responses where match_id = new.match_id;

  if v_no > 0 then
    update public.matches set status = 'dismissed' where id = new.match_id;
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

create trigger match_responses_sync
  after insert or update on public.match_responses
  for each row execute function public.sync_match_status();

-- פונקציות טריגר לא אמורות להיות ניתנות לקריאה דרך ה-API.
-- הטריגר מפעיל אותן בלי בדיקת EXECUTE, ולכן הביטול הזה בטוח.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_photo_limit() from public, anon, authenticated;
revoke execute on function public.sync_match_status() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;


-- ===========================================================================
--  שמירת ההתאמות שמנוע ה-TypeScript חישב
-- ===========================================================================
-- security definer, כי לטבלת matches אין מדיניות insert למשתמשים.
-- TODO (הרחבה עתידית): לאמת בצד השרת שכל קשת במעגל באמת עומדת בקריטריונים,
--                       ולהגביל את קצב הקריאות לפונקציה.
create or replace function public.save_matches(p_matches jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_ids uuid[];
  v_len integer;
  v_valid integer;
  v_saved integer := 0;
begin
  if auth.uid() is null then
    raise exception 'נדרשת התחברות';
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_matches, '[]'::jsonb))
  loop
    select array_agg(value::text::uuid order by ord)
      into v_ids
      from jsonb_array_elements_text(v_item->'chain_listing_ids') with ordinality t(value, ord);

    v_len := coalesce(array_length(v_ids, 1), 0);
    if v_len < 2 or v_len > 5 then
      continue;
    end if;

    select count(distinct id) into v_valid
    from public.listings
    where id = any(v_ids) and status = 'active';

    if v_valid <> v_len then
      continue;
    end if;

    insert into public.matches (match_type, chain_listing_ids, score, status)
    values (
      (v_item->>'match_type')::public.match_kind,
      v_ids,
      greatest(0, least(100, coalesce((v_item->>'score')::integer, 0))),
      'suggested'
    )
    on conflict (chain_listing_ids) do update
      set score = excluded.score
      where public.matches.status = 'suggested';

    v_saved := v_saved + 1;
  end loop;

  return v_saved;
end;
$$;

revoke all on function public.save_matches(jsonb) from public, anon;
grant execute on function public.save_matches(jsonb) to authenticated;


-- ===========================================================================
--  אחסון תמונות
-- ===========================================================================
-- קריאה ציבורית (התמונות מופיעות בלוח לכולם),
-- כתיבה רק לתיקייה האישית של המשתמש: {user_id}/{listing_id}/{file}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "listing-photos: קריאה ציבורית"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'listing-photos');

create policy "listing-photos: העלאה לתיקייה האישית"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing-photos: עדכון בתיקייה האישית"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing-photos: מחיקה מהתיקייה האישית"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
