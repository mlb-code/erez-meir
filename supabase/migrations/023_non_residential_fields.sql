-- 023 — נכס שאינו מגורים: חדרים לא רלוונטיים; שדות קרקע מ-§4.3 (בקשה מחבילה C1)
alter table public.listings alter column rooms drop not null;
alter table public.listings drop constraint if exists listings_rooms_check;
alter table public.listings
  add constraint listings_rooms_check check (rooms is null or (rooms > 0 and rooms <= 20)),
  add constraint listings_residential_requires_rooms
    check (asset_type not in ('apartment','penthouse','garden_apartment','house') or rooms is not null),
  add column land_is_fenced boolean,
  add column land_is_vacant boolean;
comment on column public.listings.rooms is 'חובה לנכס מגורים; null לנכס מסחרי/קרקע/חניה/מחסן.';
