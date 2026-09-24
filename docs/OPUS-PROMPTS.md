# פרומפטים לאופוס 5 — שלב 1, שבועות 1–2

**איך משתמשים:** לכל חבילה פותחים **worktree נפרד** — בטרמינל, מתוך `apartment-swap`:

```bash
git worktree add ../apartment-swap-<שם החבילה> -b wp/<שם החבילה> main
```

ואז פותחים סשן Claude Code **בתיקייה החדשה** (`apartment-swap-<שם החבילה>`), בוחרים מודל Opus
(`/model claude-opus-5`), ומדביקים את הפרומפט של החבילה **כמו שהוא**. חבילה אחת לסשן.
כשאופוס מסיים — Fable סוקר (שער) וממזג. אחרי המיזוג: `git worktree remove ../apartment-swap-<שם החבילה>`.

> למה worktree: ב-22.09 שני סשנים עבדו באותה תיקייה, וקומיטים נחתו על ענף לא נכון. worktree = תיקייה
> נפרדת לכל ענף, אותו repo. אי אפשר לדרוך אחד על השני.

**כללים שחלים על כל חבילה** (מופיעים בכל פרומפט, לא למחוק):
- לקרוא קודם את `docs/SPEC.md` — הסעיפים שהחבילה מפנה אליהם.
- **אסור** לשנות סכמה, RLS, views או פונקציות במסד. צריך שינוי? לכתוב `docs/SCHEMA-REQUESTS.md` ולעצור.
- לעבוד ב-branch `wp/<שם החבילה>`, commit-ים בעברית, ובסוף PR ל-main. לא למזג.
- לסיים רק כש-`npm run build`, `npm test` ו-`npm run check:e2e` ירוקים.
- טקסטים בממשק: עברית בלבד, בזכר יחיד, "0.5% + מע"מ" תמיד במלואו. מובייל-פירסט.
- לא להתקין תלויות חדשות בלי לציין למה ב-PR.
- **מספור מיגרציות:** אופוס משתמש ב-`005`–`019` (**005–006 תפוסים; הבא = 007**). Fable משתמש ב-`020` ומעלה (020–021 תפוסים). לא לגעת בקובץ מיגרציה שכבר רץ.

---

## A2 — שכונות ✅ בוצע (22.09)

```
קרא את docs/SPEC.md סעיפים 0.1, 4.3, 5.4 (טבלת neighborhoods).
משימה: למלא את הטבלה public.neighborhoods לכל אחת מ-8 הערים ב-src/lib/constants.ts (CITIES)
עם רשימת השכונות הרשמיות של כל עיר (מקור: אתר העירייה / ויקיפדיה). 15–40 שכונות לעיר.
תוצרים: (1) supabase/migrations/005_seed_neighborhoods.sql [בוצע] עם insert ... on conflict do nothing,
(2) הרצה עם npm run db:migrate, (3) עדכון src/lib/data/neighborhoods.ts עם פונקציה
getNeighborhoods(city) שמחזירה מהטבלה, (4) קישור 25 מודעות הדמו ל-neighborhood_id הנכון
לפי שדה neighborhood הקיים (migration 006). אל תשנה סכמה. branch: wp/a2-neighborhoods.
```

## A3 — מיתוג "חליפין" + מערכת עיצוב לאתר

```
קרא את docs/SPEC.md סעיף 1 (עקרונות 6–7) והנחה ה1. זה אתר, לא אפליקציה — אבל רוב המשתמשים מגיעים
מהטלפון. משימה בשני חלקים:
(1) מיתוג: להחליף "החלפה" ב"חליפין" בכל הממשק, metadata, README, LEGAL_DISCLAIMER; לוגו חדש
    ב-src/components/logo.tsx שמתאים לשם. לא לשנות שמות קבצים/טבלאות/משתנים.
(2) מערכת עיצוב: ב-src/app/globals.css לקבוע פלטה (ראשי, משני, הצלחה, אזהרה, שגיאה, ניטרלים),
    טיפוגרפיה (Heebo, 5 גדלים), רדיוסים, צללים, ריווח — כטוקנים של Tailwind v4 (@theme).
    ליצור ב-src/components/ui/ קומפוננטות בסיס אחידות: Button (3 וריאנטים, 3 גדלים, מצב טעינה),
    Input/Select/Textarea עם תווית ושגיאה, Card, Badge, EmptyState, Skeleton, Alert, PageHeader.
    להחליף בהדרגה את הקומפוננטות הקיימות בדפים הקיימים לשימוש בבסיס החדש (בלי לשנות התנהגות).
    דף דמו פנימי /design (noindex) שמציג את כל הקומפוננטות בשני הרוחבים.
תוצר: אתר שנראה עקבי ומקצועי בדסקטופ ובמובייל, בלי אנגלית בממשק. צילומי מסך של לפני/אחרי ב-PR.
branch: wp/a3-branding-design.
```

## E7 — תשתית

```
קרא את docs/SPEC.md סעיפים 13–14.
משימה: (1) Sentry לשגיאות (Next.js integration, DSN דרך משתנה סביבה, בלי PII);
(2) שירות cron ב-Railway: scripts/cron.mts שמריץ משימות לפי לוח (בינתיים: ריצה יומית של
מנוע ההתאמות דרך פונקציה חדשה runMatchingAsSystem שמשתמשת ב-scripts/seed-matches.mts כבסיס),
עם railway.json נפרד בתיקיית cron/; (3) מחיקה אוטומטית של identity_documents שעבר purge_after
(לרשום בקוד, cron יומי); (4) README: איך מוסיפים משימת cron.
אל תפרוס בעצמך ל-Railway — תעד ב-PR מה צריך להגדיר. branch: wp/e7-infra.
```

## B1 — הרשמה v2 (זהות)

```
קרא את docs/SPEC.md סעיפים 4.1, 5.3 (profiles), 11, 13.
הסכמה כבר קיימת: profiles.identity_status, phone_verified_at, id_number_last4, birth_date,
טבלת identity_documents, דלי identity-docs (פרטי), ופונקציית public.submit_identity(p_id_number, p_birth_date).
משימה: לבנות את זרימת ההרשמה בארבעה צעדים: אימייל+סיסמה (קיים) → טלפון: הזנת מספר;
אם משתנה הסביבה SMS_ENABLED=true — שליחת קוד ואימות דרך Supabase Phone Auth; אחרת (ברירת
המחדל עכשיו, SMS נסגר בסוף) — המספר נשמר בפרופיל בלי אימות ו-phone_verified_at נשאר ריק.
הזרימה חייבת לעבוד מלא בשני המצבים → מספר ת"ז + תאריך לידה (קריאה ל-submit_identity) + העלאת צילום ת"ז ל-identity-docs/{user_id}/…
ושורה ב-identity_documents → מסך "הזהות שלך בבדיקה". משתמש ב-identity_status <> 'verified'
לא יכול לפרסם (חסימה ב-saveWantedAndPublish + הודעה ברורה). לא לגעת בחתימת מסמכים (B2).
בדיקות Playwright לזרימה. branch: wp/b1-identity.
```

## C1 — אשף פרסום v2

```
קרא את docs/SPEC.md סעיף 4.3 במלואו, 5.3 (listings), ו-src/lib/types.ts (Listing).
כל העמודות כבר קיימות במסד. משימה: להרחיב את אשף הפרסום (src/app/new/*) לכל השדות של §4.3:
סוג נכס (asset_type) עם שדות דינמיים לפי סוג (דירה/מסחרי/קרקע), שכונה מרשימה
(getNeighborhoods מחבילה A2 — אם עוד לא קיימת, השתמש בטבלה ישירות), מספר בית (פרטי),
גוש/חלקה/תת-חלקה, סוג זכות, שדות משפטיים, חלון פינוי, חניות, מחסן, תשואה/ייעוד;
ו"מה אני מחפש" מורחב: סוגי נכס, שכונות, קומה מינ', טווח שווי, חלון זמן, העדפות רכות (soft_prefs 0–3).
תמונות: checkbox "תמונה חיצונית" → listing_photos.is_exterior. ולידציית Zod לכל שדה.
פרסום עובר דרך status = 'pending_ownership' (לא 'active') — האקטיבציה קורית ב-C2.
לעדכן seed.sql ו-scripts/seed-matches.mts כך שנתוני הדמו ימלאו את השדות החדשים באופן ריאלי.
branch: wp/c1-listing-wizard.
```

## C2 — אימות בעלות

```
קרא את docs/SPEC.md סעיף 4.2, 5.4 (ownership_verifications), 13.
משימה: צעד באשף (אחרי C1): העלאת נסח טאבו PDF ל-ownership-docs/{user_id}/{listing_id}/…,
חילוץ טקסט בשרת (pdf-parse) לפי מפרט: גוש/חלקה/תת-חלקה, שמות ות"ז של בעלי הזכות,
הערות אזהרה, משכנתאות, עיקולים, שטח רשום → JSON ל-extracted; מסך "זה מה שמצאנו — נכון?";
שמירת שורה ב-ownership_verifications (status pending) והמודעה ב-pending_ownership.
המפרט המדויק של החילוץ יגיע מ-Fable אחרי קבלת 3 נסחים אמיתיים — בינתיים לבנות את הזרימה
עם parser על בסיס הכותרות המקובלות בנסח, ולהשאיר את הפונקציה extractNesach() מבודדת וניתנת להחלפה.
ללא מסך תפעול (E4) — אישור ידני יתבצע בינתיים ב-SQL. branch: wp/c2-ownership.
```

## C3 — הזמנה בכתב בעת פרסום

```
B2 מוכן. קרא את docs/SPEC.md סעיפים 10.1, 10.2, ואת src/lib/signing/sign.ts,
src/components/signing/sign-document.tsx ואת הדוגמה ב-src/app/documents/[kind]/page.tsx.
משימה: אחרי צעד אימות הבעלות ולפני שליחה לבדיקה, המשתמש חותם על "הזמנה בכתב לביצוע
פעולת תיווך" עבור הנכס הספציפי: בשרת prepareDocument('brokerage_order', vars) עם המשתנים
שהתבנית דורשת (full_name, id_number_masked, asset_description, city, gush, helka, tat_helka,
asking_value), ואז <SignDocument ... relatedListingId={listing.id}>. התבנית v1 כבר קיימת
ב-document_templates. אין לשנות את מנגנון החתימה עצמו — רק להשתמש בו. לא לגעת ב-SMS
(SMS_ENABLED מטופל בתוך המנגנון). branch: wp/c3-brokerage-order.
```
