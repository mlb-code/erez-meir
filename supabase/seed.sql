-- ===========================================================================
--  נתוני הדגמה: 25 בעלי דירות + 25 מודעות
--  להרצה אחרי schema.sql. אפשר להריץ שוב — הקובץ מנקה הרצה קודמת.
--  סיסמה אחידה לכל משתמשי הדמו: Demo1234!
--
--  המודעות מתוכננות כך שמנוע ההתאמות ימצא בדיוק:
--    3 התאמות ישירות, 2 שרשראות תלת-כיווניות ושרשרת אחת של 4.
-- ===========================================================================

delete from auth.users where email like '%@demo.swap.co.il';

create temp table seed_rows (
  email text, full_name text, phone text,
  city text, neighborhood text, street text,
  rooms numeric(3,1), size_sqm int, floor int, total_floors int,
  has_elevator bool, has_parking bool, has_balcony bool, has_safe_room bool,
  building_year int, condition public.property_condition, urban_renewal public.urban_renewal_type,
  asking_value bigint, description text,
  wanted_cities text[], w_min_rooms numeric(3,1), w_max_rooms numeric(3,1), w_min_sqm int,
  must_haves public.property_feature[], cash_add_max bigint, cash_receive_min bigint,
  photo_a int, photo_b int
);

insert into seed_rows values
-- ---------- התאמה ישירה 1 ----------
('yehuda@demo.swap.co.il','יהודה אבן־חן','050-2410019','תל אביב','לב העיר','מזא"ה',3,75,2,4,true,false,true,false,1978,'renovated','tama38_planned',4500000,
 'שלושה חדרים משופצים מהיסוד בלב תל אביב, מרפסת שמש פונה לדרום, בניין לקראת תמ״א 38. מחפש להתרחב למשפחה גדלה.',
 array['הרצליה'],4,4.5,95,array[]::public.property_feature[],400000,0,1,2),

('michal@demo.swap.co.il','מיכל ברששת','052-7719340','הרצליה','הרצליה הצעירה','הבנים',4,100,3,5,true,true,true,true,2006,'maintained','none',4800000,
 'ארבעה חדרים מרווחים בהרצליה הצעירה, ממ״ד, חניה בטאבו ומעלית. הילדים עזבו את הבית ואנחנו מחפשים משהו קטן ותוסס במרכז תל אביב.',
 array['תל אביב'],3,3.5,70,array[]::public.property_feature[],0,200000,3,4),

-- ---------- התאמה ישירה 2 ----------
('avi@demo.swap.co.il','אבי טולדנו','054-3388201','רמת גן','שכונת הבורסה','ז׳בוטינסקי',4,95,7,12,true,false,true,true,2012,'maintained','none',3200000,
 'ארבעה חדרים בבניין חדש יחסית באזור הבורסה, נוף פתוח מקומה שביעית, ממ״ד ומעלית. חסרה לנו חניה — ולכן מחפשים גבעתיים עם חניה.',
 array['גבעתיים'],3,4,80,array['parking']::public.property_feature[],300000,0,5,6),

('tamar@demo.swap.co.il','תמר גולדשמידט','053-9012774','גבעתיים','בורוכוב','כצנלסון',3.5,85,1,4,false,true,true,false,1985,'renovated','tama38_approved',3400000,
 'שלושה וחצי חדרים משופצים בבורוכוב, חניה פרטית וגינה קטנה. הבניין קיבל היתר תמ״א 38. מחפשת דירה גדולה יותר עם מעלית — הברכיים כבר לא מה שהיו.',
 array['רמת גן'],4,5,90,array['elevator']::public.property_feature[],0,100000,7,8),

-- ---------- התאמה ישירה 3 ----------
('shira@demo.swap.co.il','שירה בן־עמי','050-6642318','רעננה','קרית שרת','אחוזה',5,130,4,6,true,true,true,true,2010,'maintained','none',3900000,
 'חמישה חדרים גדולים ברעננה, שתי מרפסות, ממ״ד, חניה כפולה ומעלית. שקט ומשפחתי. אנחנו רוצים לחזור לעיר הגדולה גם במחיר של דירה קטנה יותר.',
 array['תל אביב'],3,4,75,array['balcony']::public.property_feature[],0,0,9,10),

('noam@demo.swap.co.il','נועם קסטיאל','058-4477125','תל אביב','בבלי','ברודצקי',3.5,80,5,9,true,false,true,false,1998,'maintained','none',3500000,
 'שלושה וחצי חדרים בבבלי, מרפסת גדולה מול הפארק, מעלית. גדלנו כמשפחה ואנחנו מחפשים חמישה חדרים עם ממ״ד וחניה ברעננה.',
 array['רעננה'],4.5,5.5,120,array['safe_room','parking']::public.property_feature[],500000,0,11,12),

-- ---------- שרשרת תלת־כיוונית 1 ----------
('david@demo.swap.co.il','דוד מזרחי','052-2298806','פתח תקווה','כפר גנים ג׳','העצמאות',4,100,3,8,true,true,true,true,2008,'maintained','none',2600000,
 'ארבעה חדרים בכפר גנים ג׳, ממ״ד, מרפסת וחניה מקורה. שכונה ירוקה עם גנים וכיתות. מחפש להתרחב לראשון לציון קרוב למשפחה.',
 array['ראשון לציון'],4,5,100,array['parking']::public.property_feature[],400000,0,13,14),

('orly@demo.swap.co.il','אורלי שרעבי','050-8817443','ראשון לציון','נווה ים','הרצל',4.5,110,5,9,true,true,true,true,2014,'new','none',2900000,
 'ארבעה וחצי חדרים כמעט חדשים בנווה ים, ממ״ד, מרפסת שמש, חניה תת־קרקעית ומחסן. אנחנו רוצים להתקרב לעבודה ברמת גן.',
 array['רמת גן'],3,4,85,array['elevator']::public.property_feature[],500000,0,15,16),

('roni@demo.swap.co.il','רוני אלפסי','054-6635902','רמת גן','שכונת הראשונים','ביאליק',3.5,90,4,6,true,false,true,false,1996,'maintained','none',3300000,
 'שלושה וחצי חדרים בשכונת הראשונים, מרפסת, מעלית ובניין שמור. אני מחפשת דירה גדולה בפתח תקווה עם חניה — ומצפה להשלמה כספית משמעותית.',
 array['פתח תקווה'],4,5,95,array['parking']::public.property_feature[],0,500000,17,18),

-- ---------- שרשרת תלת־כיוונית 2 ----------
('gil@demo.swap.co.il','גיל פרידמן','053-3320988','גבעתיים','גבעת רמב״ם','שינקין',3,70,2,3,false,false,true,false,1968,'needs_renovation','pinui_binui_planned',3100000,
 'שלושה חדרים בגבעת רמב״ם, מרפסת קטנה, דורשת שיפוץ. הבניין נכלל בתוכנית פינוי־בינוי בהליכי תכנון. מחפש דירה מוכנה לכניסה ברמת השרון.',
 array['רמת השרון'],4,5,100,array['safe_room']::public.property_feature[],900000,0,19,20),

('efrat@demo.swap.co.il','אפרת נחמיאס','050-5504127','רמת השרון','מורשה','אוסישקין',4,105,3,5,true,true,false,true,2009,'maintained','none',4000000,
 'ארבעה חדרים במורשה, ממ״ד, חניה ומעלית, קרוב לבתי ספר ולפארק. אנחנו מחפשים בית גדול יותר בהרצליה, מוכנים להוסיף מהחיסכון.',
 array['הרצליה'],5,6,130,array['parking','elevator']::public.property_feature[],1200000,0,21,22),

('yossi@demo.swap.co.il','יוסי דהאן','052-9943006','הרצליה','נווה עמל','סוקולוב',5,140,2,4,true,true,true,true,2016,'new','none',5100000,
 'חמישה חדרים חדשים בנווה עמל, ממ״ד, מרפסת ענקית, שתי חניות ומעלית. הילדים גדלו והבית גדול מדי — מחפש דירה קומפקטית בגבעתיים ולשחרר הון.',
 array['גבעתיים'],3,4,65,array['balcony']::public.property_feature[],0,1500000,23,24),

-- ---------- שרשרת של 4 ----------
('maya@demo.swap.co.il','מאיה רוזנברג','058-2216740','תל אביב','נווה צדק','שלוש',2.5,60,1,3,false,false,true,false,1962,'renovated','none',3800000,
 'שניים וחצי חדרים מקסימים בנווה צדק, שופצו בקפידה תוך שמירה על האופי המקורי, מרפסת פונה לחצר פנימית. מחפשת יותר מקום בגבעתיים.',
 array['גבעתיים'],3.5,4.5,85,array['elevator']::public.property_feature[],200000,0,25,26),

('eran@demo.swap.co.il','ערן ויסמן','054-7708312','גבעתיים','שינקין','ההסתדרות',4,90,6,8,true,true,false,false,2001,'maintained','none',3950000,
 'ארבעה חדרים בלב גבעתיים, מעלית וחניה, קומה שישית עם אוויר. אנחנו משפחה גדולה ומחפשים חמישה חדרים עם ממ״ד בפתח תקווה, עם השלמה כספית.',
 array['פתח תקווה'],5,6,120,array['parking','safe_room']::public.property_feature[],0,400000,27,28),

('hadas@demo.swap.co.il','הדס אלמוג','050-3392265','פתח תקווה','אם המושבות','ברקת',5,125,4,10,true,true,true,true,2013,'maintained','none',3400000,
 'חמישה חדרים באם המושבות החדשה, ממ״ד, מרפסת שמש, חניה תת־קרקעית ומעלית. מחפשת להתקרב לראשון לציון בגלל העבודה.',
 array['ראשון לציון'],4,5,105,array['elevator']::public.property_feature[],300000,0,29,30),

('itai@demo.swap.co.il','איתי בר־און','053-6621809','ראשון לציון','רמת אליהו','ז׳בוטינסקי',4.5,110,7,11,true,true,true,false,2005,'renovated','none',3600000,
 'ארבעה וחצי חדרים משופצים ברמת אליהו, מרפסת, מעלית וחניה. אנחנו זוג צעיר בלי ילדים ורוצים דירה קטנה ומיוחדת בתל אביב.',
 array['תל אביב'],2,3,55,array['balcony']::public.property_feature[],300000,0,31,32),

-- ---------- מודעות נוספות (רקע מציאותי ללוח) ----------
('lior@demo.swap.co.il','ליאור אשכנזי','052-1145690','תל אביב','פלורנטין','וויטל',2,50,3,4,false,false,true,false,1955,'maintained','pinui_binui_planned',2900000,
 'שני חדרים בפלורנטין, מרפסת צרפתית, בניין בהליך פינוי־בינוי. מחפש קצת יותר מקום ברמת גן או גבעתיים בלי לקפוץ במחיר.',
 array['רמת גן','גבעתיים'],3,4,70,array[]::public.property_feature[],300000,0,33,34),

('sigal@demo.swap.co.il','סיגל אוחיון','050-7723418','רמת גן','נווה יהושע','המעגל',5,120,8,14,true,true,true,true,2018,'new','none',4600000,
 'חמישה חדרים בבניין חדש בנווה יהושע, ממ״ד, שתי מרפסות, חניה כפולה ומחסן. מחפשת לעבור לתל אביב באותו גודל — מוכנה להוסיף.',
 array['תל אביב'],4,5,100,array['parking','elevator']::public.property_feature[],1500000,0,35,36),

('nadav@demo.swap.co.il','נדב חלימי','054-2208853','הרצליה','הרצליה ב׳','ההגנה',3,78,2,4,false,false,true,false,1988,'maintained','tama38_planned',3700000,
 'שלושה חדרים בהרצליה ב׳, מרפסת, קרוב לחוף. מחפש דירת משפחה עם ממ״ד ברעננה או רמת השרון.',
 array['רעננה','רמת השרון'],4,5,100,array['safe_room']::public.property_feature[],600000,0,37,38),

('ruth@demo.swap.co.il','רות שטיינברג','050-9931276','רמת השרון','כפר הירוק','ז׳בוטינסקי',5.5,150,1,3,true,true,true,true,2011,'maintained','none',6200000,
 'חמישה וחצי חדרים ברמת השרון, גינה, ממ״ד, שתי חניות ומעלית. מחפשת דירה גדולה בתל אביב עם כל התנאים — ומצפה להשלמה כספית של לפחות 800 אלף.',
 array['תל אביב'],4,5,120,array['elevator','parking','safe_room']::public.property_feature[],0,800000,39,40),

('amir@demo.swap.co.il','אמיר לוגסי','053-8814402','רעננה','נווה זמר','בורוכוב',4,100,3,6,true,true,false,true,2004,'maintained','none',3300000,
 'ארבעה חדרים בנווה זמר, ממ״ד, חניה ומעלית. אנחנו מחפשים בית גדול באמת — חמישה או שישה חדרים בפתח תקווה או ראשון לציון.',
 array['פתח תקווה','ראשון לציון'],5,6,130,array['parking']::public.property_feature[],200000,0,41,42),

('galit@demo.swap.co.il','גלית פרץ','052-6690337','פתח תקווה','שעריה','חובבי ציון',3,72,2,5,true,false,false,false,1992,'maintained','none',2200000,
 'שלושה חדרים בשעריה, מעלית, בניין שקט. מחפשת משהו קצת יותר גדול בראשון לציון.',
 array['ראשון לציון'],3,4,75,array[]::public.property_feature[],400000,0,43,44),

('shaul@demo.swap.co.il','שאול חדד','050-4478125','ראשון לציון','נחלת יהודה','הרצל',3.5,88,4,7,true,true,true,false,1999,'renovated','none',2450000,
 'שלושה וחצי חדרים משופצים בנחלת יהודה, מרפסת, מעלית וחניה. מחפש דירה קטנה בתל אביב או רמת גן — מוכן להוסיף מכיסי.',
 array['תל אביב','רמת גן'],2,3,45,array[]::public.property_feature[],900000,0,45,46),

('dana@demo.swap.co.il','דנה כרמלי','058-3307719','גבעתיים','גבעת התחמושת','כורזין',4.5,105,5,7,true,true,true,true,2015,'new','none',4300000,
 'ארבעה וחצי חדרים בבניין חדש בגבעת התחמושת, ממ״ד, מרפסת, חניה תת־קרקעית ומעלית. מחפשת אוויר ושקט בהרצליה או רמת השרון.',
 array['הרצליה','רמת השרון'],4,5.5,110,array['safe_room','parking']::public.property_feature[],1000000,0,47,48),

('boaz@demo.swap.co.il','בועז נוימן','054-9925604','תל אביב','הצפון הישן','ארלוזורוב',4,105,4,6,true,true,true,true,2007,'renovated','none',7000000,
 'ארבעה חדרים משופצים בצפון הישן, ממ״ד, מרפסת, חניה ומעלית. מחפש וילה או דירת גן גדולה בשרון — ומצפה להשלמה של לפחות מיליון שקל.',
 array['הרצליה','רמת השרון','רעננה'],5,7,150,array['parking','safe_room','elevator']::public.property_feature[],0,1000000,49,50);

-- משתמשי הדמו, מאומתים מראש
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  s.email,
  extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', s.full_name, 'phone', s.phone),
  '', '', '', ''
from seed_rows s;

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
       'email', now(), now(), now()
from auth.users u
where u.email like '%@demo.swap.co.il';

-- המודעות
insert into public.listings (
  owner_id, status, city, neighborhood, street, rooms, size_sqm, floor, total_floors,
  has_elevator, has_parking, has_balcony, has_safe_room, building_year, condition, urban_renewal_status,
  asking_value, description, wanted_cities, wanted_min_rooms, wanted_max_rooms, wanted_min_sqm,
  must_haves, cash_add_max, cash_receive_min
)
select
  u.id, 'active', s.city, s.neighborhood, s.street, s.rooms, s.size_sqm, s.floor, s.total_floors,
  s.has_elevator, s.has_parking, s.has_balcony, s.has_safe_room, s.building_year, s.condition, s.urban_renewal,
  s.asking_value, s.description, s.wanted_cities, s.w_min_rooms, s.w_max_rooms, s.w_min_sqm,
  s.must_haves, s.cash_add_max, s.cash_receive_min
from seed_rows s
join auth.users u on u.email = s.email;

-- שתי תמונות דמו לכל מודעה (קבצי SVG מקומיים מתוך public/placeholders)
insert into public.listing_photos (listing_id, storage_path, sort_order)
select l.id, '/placeholders/apt-' || (((s.photo_a - 1) % 8) + 1) || '.svg', 0
from seed_rows s
join auth.users u on u.email = s.email
join public.listings l on l.owner_id = u.id;

insert into public.listing_photos (listing_id, storage_path, sort_order)
select l.id, '/placeholders/apt-' || (((s.photo_b - 1) % 8) + 1) || '.svg', 1
from seed_rows s
join auth.users u on u.email = s.email
join public.listings l on l.owner_id = u.id;

drop table seed_rows;

-- ===========================================================================
--  אחרי הרצת הקובץ הזה: מריצים `npm run verify:matches` כדי לראות את המעגלים,
--  ואז נכנסים לאתר ולוחצים "חיפוש התאמות מחדש" במסך ההתאמות כדי לשמור אותם.
-- ===========================================================================
