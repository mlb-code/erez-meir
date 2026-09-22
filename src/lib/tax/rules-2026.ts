/**
 * כללי המס לסימולטור — נכון לשנת 2026 (מקור: תוכנית עסקית חליפין, פרק 6; חוק מיסוי מקרקעין).
 * כל מספר כאן הוא תצורה. שינוי בחוק = גרסה חדשה של הקובץ + עדכון RULES_VERSION.
 * אין באמור ייעוץ מס.
 */
export const RULES_VERSION = '2026-09';

/** מדרגה: עד סכום (null = ללא תקרה) → שיעור. */
export interface Bracket { upTo: number | null; rate: number }

/** מס רכישה — דירת מגורים יחידה (מוקפא עד ינואר 2028). */
export const PURCHASE_TAX_SINGLE_HOME: Bracket[] = [
  { upTo: 1_978_745, rate: 0 },
  { upTo: 2_347_040, rate: 0.035 },
  { upTo: 6_055_070, rate: 0.05 },
  { upTo: 20_183_565, rate: 0.08 },
  { upTo: null, rate: 0.10 },
];

/** מס רכישה — דירה נוספת. */
export const PURCHASE_TAX_ADDITIONAL_HOME: Bracket[] = [
  { upTo: 6_055_070, rate: 0.08 },
  { upTo: null, rate: 0.10 },
];

/** מס רכישה — נכס שאינו דירת מגורים (מסחרי, קרקע, חניה, מחסן): שיעור אחיד. */
export const PURCHASE_TAX_NON_RESIDENTIAL_RATE = 0.06;

/** מס שבח. */
export const SHEVACH = {
  /** שיעור המס על השבח הריאלי ליחיד. */
  RATE: 0.25,
  /** תקרת פטור דירה יחידה (סעיף 49ב(2)), מוקפאת 2024–2027. */
  SINGLE_HOME_EXEMPTION_CEILING: 5_008_000,
  /** תקופת החזקה מינימלית לפטור, בחודשים. */
  SINGLE_HOME_MIN_HOLDING_MONTHS: 18,
  /** חישוב לינארי מוטב: שבח שנצבר עד תאריך זה פטור. */
  LINEAR_EXEMPT_UNTIL: new Date('2014-01-01T00:00:00Z'),
  /** הפטור ניתן לניצול פעם בכל X חודשים. */
  EXEMPTION_COOLDOWN_MONTHS: 18,
} as const;

/** מע"מ. */
export const VAT_RATE = 0.18;

/** עמלת הפלטפורמה. */
export const PLATFORM_FEE = {
  /** עמלת הצלחה רגילה, מכל צד, על שווי הנכס שהצד מסר. */
  STANDARD_RATE: 0.005,
  /** עמלה מופחתת למי שמדווח על חתימה בתוך 14 יום ומעלה עותק הסכם. */
  ON_TIME_REPORT_RATE: 0.0045,
  ON_TIME_REPORT_DAYS: 14,
} as const;
