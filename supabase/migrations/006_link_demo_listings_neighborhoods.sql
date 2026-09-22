-- ===========================================================================
--  006 — קישור מודעות הדמו לשכונה מהטבלה (חבילה A2, שלב 4)
--  לפי שדה הטקסט listings.neighborhood הקיים → listings.neighborhood_id.
--  אין שינוי סכמה. נתונים בלבד.
--
--  חמש מודעות דמו נכתבו בשם שאינו זהה לשם הקנוני בטבלה — מתקנים קודם את הטקסט:
--    גבעתיים   "גבעת התחמושת"   → "כורזין"            (גבעת התחמושת היא בירושלים; רחוב כורזין = מתחם כורזין)
--    רמת גן    "שכונת הבורסה"   → "הבורסה"
--    רמת גן    "שכונת הראשונים" → "הראשונים"
--    רעננה     "קרית שרת"       → "קריית שרת"         (כתיב מלא, כמו בטבלה)
--    פתח תקווה "אם המושבות"     → "אם המושבות החדשה" (תיאור המודעה ורחוב ברקת — החלק החדש)
--  אותם תיקונים נעשו גם ב-supabase/seed.sql כדי ששחזור מאפס יתאים.
-- ===========================================================================

update public.listings
set neighborhood = 'כורזין',
    description  = replace(description, 'בגבעת התחמושת', 'במתחם כורזין')
where city = 'גבעתיים' and neighborhood = 'גבעת התחמושת';

update public.listings set neighborhood = 'הבורסה'
where city = 'רמת גן' and neighborhood = 'שכונת הבורסה';

update public.listings set neighborhood = 'הראשונים'
where city = 'רמת גן' and neighborhood = 'שכונת הראשונים';

update public.listings set neighborhood = 'קריית שרת'
where city = 'רעננה' and neighborhood = 'קרית שרת';

update public.listings set neighborhood = 'אם המושבות החדשה'
where city = 'פתח תקווה' and neighborhood = 'אם המושבות';

-- הקישור עצמו: התאמה מדויקת של (עיר, שם) לכל מודעה שעדיין לא מקושרת
update public.listings l
set neighborhood_id = n.id
from public.neighborhoods n
where l.neighborhood_id is null
  and l.neighborhood is not null
  and n.city = l.city
  and n.name = btrim(l.neighborhood);

-- בקרה: כל מודעות הדמו חייבות להיות מקושרות. אם לא — המיגרציה נכשלת ומתבטלת.
do $$
declare
  missing int;
  names text;
begin
  select count(*), string_agg(l.city || ' / ' || coalesce(l.neighborhood, '(ריק)'), ', ')
    into missing, names
  from public.listings l
  join auth.users u on u.id = l.owner_id
  where u.email like '%@demo.swap.co.il'
    and l.neighborhood_id is null;

  if missing > 0 then
    raise exception '006: % מודעות דמו ללא neighborhood_id: %', missing, names;
  end if;
end $$;
