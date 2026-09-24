-- ===========================================================================
--  024 — החלטת אימות הבעלות שמורה למנהל התפעול (§4.2)
--
--  מדיניות ה-RLS מאפשרת לבעלים (ולמתווך שלו) לעדכן כל עמודה במודעה שלו, ולכן
--  אחרי C1 — שבו הפרסום מעביר את המודעה ל-pending_ownership — בעלים יכול היה
--  לקרוא ל-API ישירות, לסמן לעצמו ownership_status = 'approved' ולהפעיל את
--  המודעה בלי נסח. הטריגר סוגר את זה:
--    • משתמש רגיל (לא ops) יכול רק להגיש: → 'pending', ורק אם ההחלטה הקודמת
--      לא הייתה 'approved'.
--    • approved / rejected / needs_more — רק ops.
--    • חיבור ישיר למסד (auth.uid() ריק: מיגרציות, seed, אישור ידני ב-SQL
--      עד שמסך התפעול E4 קיים) אינו מוגבל.
-- ===========================================================================

create or replace function private.guard_listing_ownership()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.ownership_status is distinct from old.ownership_status
     and auth.uid() is not null
     and not private.is_ops() then
    if new.ownership_status is distinct from 'pending'::public.ownership_status then
      raise exception 'רק מנהל תפעול יכול להכריע באימות בעלות' using errcode = '42501';
    end if;
    if old.ownership_status = 'approved' then
      raise exception 'אימות בעלות שאושר אינו ניתן לשינוי על ידי המשתמש' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists listings_guard_ownership on public.listings;
create trigger listings_guard_ownership
  before update on public.listings
  for each row execute function private.guard_listing_ownership();
