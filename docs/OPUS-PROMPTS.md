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
- **מספור מיגרציות:** אופוס משתמש ב-`005`–`019` (**005–006 תפוסים; הבא = 007**). Fable משתמש ב-`020` ומעלה (020–024 תפוסים). לא לגעת בקובץ מיגרציה שכבר רץ.

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

## A3 — מיתוג "חליפין" + מערכת עיצוב לאתר ✅ בוצע (24.09, PR #1)

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

## C1 — אשף פרסום v2 ✅ בוצע (24.09, PR #2)

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
ללא מסך תפעול (E4) — אישור ידני יתבצע בינתיים ב-SQL. שים לב למיגרציה 024: משתמש רגיל יכול לשנות
ownership_status רק ל-'pending' (ולא אם כבר 'approved'); approved/rejected/needs_more — רק ops, או חיבור
ישיר למסד. אל תנסה לעקוף את זה בקוד. branch: wp/c2-ownership.
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

---

# שבועות 3–4

## E1 — תור התראות

```
קרא את docs/SPEC.md סעיף 11 ו-5.4 (טבלת notifications). הטבלה כבר קיימת, ו-B2 כבר מכניס אליה
שורות (template='signed_document_copy'). משימה: (1) src/lib/notifications/: enqueue(userId, channel,
template, payload, scheduledFor?) + 12 התבניות של §11 כפונקציות שמחזירות {subject, text, html}
בעברית; (2) worker ב-scripts/run-notifications.mts שמושך queued שהגיע זמנם ושולח: אימייל דרך Resend
אם RESEND_API_KEY קיים, אחרת מסמן 'sent' עם provider_id='noop' ורושם ללוג (EMAIL_ENABLED=false);
SMS — רק אם SMS_ENABLED=true (אחרת מדלג עם status='cancelled' והערה); (3) חיבור האירועים הקיימים
לתור: התאמה חדשה (ב-runMatching — פעם ביום לכל משתמש לכל היותר), משתתף אישר, כולם אישרו, אישור
הפגשה נחתם/נפתח, הודעה בצ'אט שלא נקראה שעה (הוסף messages.read_at — זה שינוי סכמה! → בקש מ-Fable
במקום, או תעד ב-SCHEMA-REQUESTS.md ותדלג על האירוע הזה); תזכורות סגירה 7/30/60/90 יום.
בדיקות יחידה לתבניות ולתזמון. branch: wp/e1-notifications.
```

## E2 — יבוא עסקאות ציבוריות (CSV)

```
קרא את docs/SPEC.md סעיפים 0.3 (ט1), 9.1, 5.4 (public_transactions). אין API — מנהל התפעול מייצא
Excel/CSV מאתר nadlan.gov.il לפי יישוב. משימה: scripts/import-transactions.mts <file.csv> --source
nadlan_gov_csv: קורא CSV (UTF-8 או Windows-1255 — לזהות), ממפה עמודות בעברית (תאריך מכירה, מחיר,
גוש, חלקה, תת חלקה, יישוב, רחוב, מספר בית, שטח, חדרים, קומה) עם מיפוי גמיש לפי כותרות,
מחשב source_row_hash (sha256 של השורה המנורמלת), מכניס אידמפוטנטית. דוח בסוף: נקלטו/כפולים/נדחו+סיבה.
קובץ CSV לדוגמה ב-scripts/fixtures/ עם 20 שורות מומצאות למבחן. אחרי E4 — כפתור העלאה במסך התפעול
שקורא לאותה לוגיקה. branch: wp/e2-import-transactions.
```

## E4 — מסך התפעול

```
קרא את docs/SPEC.md סעיף 12 במלואו, 4.2, 4.6, 9.2, 13. גישה: profiles.account_type='ops' (יש
private.is_ops() ו-RLS מתאים לכל הטבלאות). משימה: /ops עם תפריט צד, דסקטופ-פירסט, עברית:
(1) תורים: זהויות (identity_status='submitted'), בעלויות (ownership_verifications.status='pending'),
התראות סורק (scan_alerts.status='new'), סגירות לאישור (closings.approved_at is null), חשבוניות
(approved ובלי invoice_number). (2) בדיקת זהות: צילום מ-identity-docs דרך signed URL ל-10 דק',
הפרטים המוקלדים, ת"ז מלא דרך rpc ops_read_id_number, אישור/דחייה+סיבה → מעדכן profiles ו-
identity_documents.decision. (3) בדיקת בעלות: הנסח (signed URL), extracted מול declared, ת"ז המשתמש;
אישור → listings.ownership_status='approved' ו-status='active' (ואז runMatching); דחייה/בקשת מסמך.
(4) התאמות: טבלה ממוינת לפי estimated_close_probability, פתיחה עם משתתפים, ציונים, exposure_log,
צ'אט לקריאה. (5) סגירות: אישור, חישוב עמלה (fee_rate/fee_amount/vat כבר בשורה), הזנת מספר חשבונית
+ העלאת PDF ל-agreements/, "נשלח". (6) התראות סורק: false_positive / reviewing / confirmed_bypass +
notes. (7) דשבורד: 5 המדדים של §12. כל פעולה → audit_log. משתמש ops ראשון: מיגרציה 0xx (בטווח
שלך) שמסמנת את ops@halifin.co.il אם קיים — ותעד ב-PR איך ליצור אותו. branch: wp/e4-ops-console.
```

## E5 — חבילת ראיות ל-PDF

```
קרא את docs/SPEC.md סעיף 9.3. תלוי ב-E4. משימה: כפתור "חבילת ראיות" בעמוד מעגל במסך התפעול →
PDF אחד (pdf-lib או @react-pdf/renderer, עברית RTL עם Heebo מוטמע): כל signed_documents של
המשתתפים (סוג, גרסה, hash, זמן, IP, אמצעי אימות), exposure_log של המעגל, tax_simulations שהוצגו,
לוג הצ'אט, closings. כותרת עם מזהה המעגל ותאריך הפקה, ו-hash של ה-PDF עצמו בסוף.
branch: wp/e5-evidence-pack.
```

## E6 — חשבון מתווך

```
קרא את docs/SPEC.md סעיפים 3, 5.4 (brokers_clients), 0.1 (מתווכים). משימה: (1) בהרשמה — בחירה
"אני מתווך" → account_type='broker' + מספר רישיון (חובה); (2) מתווך מפרסם נכס בשם לקוח: באשף,
צעד "פרטי הלקוח" (שם, טלפון, אימייל) → יוצר/מאתר חשבון לקוח (הזמנה במייל דרך התור של E1),
listings.broker_id = המתווך, owner_id = הלקוח; הלקוח חייב לחתום בעצמו על ההזמנה בכתב (C3) —
המתווך לא חותם במקומו; (3) brokers_clients עם consent_document_id אחרי החתימה; (4) "הנכסים שלי"
למתווך מציג את כל נכסי לקוחותיו, ומסך ההתאמות מציג התאמות שלהם (RLS כבר מאפשר). מתווך לא רואה
צ'אט ולא פרטי קשר של הצד השני. branch: wp/e6-broker.
```

## E8 — נתוני דמו v2

```
קרא את docs/SPEC.md סעיף 4.3 ו-supabase/seed.sql. משימה: להרחיב את seed.sql ל-40 נכסים:
25 הקיימים + 15 חדשים, מהם 4 מסחריים (משרד/חנות/מחסן) ו-2 קרקע, כולל כל השדות החדשים באופן
ריאלי (גוש/חלקה מומצאים אבל בפורמט נכון, חלונות זמן, מצב משפטי מגוון, soft_prefs, שכונות
מהטבלה). לתכנן כך שייווצרו גם: התאמה שנחסמת רק בגלל שכונה, התאמה שנחסמת רק בגלל חלון זמן,
מעגל בכל מצב (suggested/partial/all_interested/meeting_confirmed/in_negotiation/closing/swapped/
dismissed/expired), נכס מסחרי בהתאמה ישירה. זהויות מאומתות, ownership approved. לעדכן
scripts/seed-matches.mts בהתאם ולוודא ש-check:e2e ו-check:signing עוברים. branch: wp/e8-seed-v2.
```

## E9 — בדיקות דפדפן + README

```
משימה: Playwright (devDependency, chromium) עם 20+ בדיקות למסע הלקוח המלא במובייל (390px)
ובדסקטופ: הרשמה→זהות→פרסום (כל השלבים)→בעלות→הזמנה בכתב→התאמה→מעוניין→אישור הפגשה→חשיפה→
צ'אט→סמן שנחתם, וגם: מתווך, מסך תפעול (אישור זהות ובעלות), בדיקות RTL (אין גלישה אופקית,
אין אנגלית). npm run test:browser. README.md v2 בעברית: מה זה, איך מריצים, איך פורסים
(railway up), כל הסקריפטים, מבנה. branch: wp/e9-browser-tests.
```
