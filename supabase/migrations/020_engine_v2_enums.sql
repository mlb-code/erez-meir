-- 020 — מנוע v2: "חובה שיהיה" מורחב (§4.3): ללא שוכר, ללא הערות אזהרה.
-- קובץ נפרד: ערך enum חדש לא ניתן לשימוש באותה טרנזקציה.
alter type public.property_feature add value if not exists 'no_tenant';
alter type public.property_feature add value if not exists 'no_caveats';
