import { z } from 'zod';
import {
  ASSET_TYPES,
  CITIES,
  COMMERCIAL_USES,
  LAND_ZONINGS,
  SOFT_PREF_KEYS,
  assetGroup,
  type AssetGroup,
} from './constants';
import type { AssetType, SoftPrefs } from './types';

/**
 * ולידציה של אשף הפרסום (§4.3), מופרדת מ-Server Actions כדי שתהיה בדיקה
 * טהורה: אותה פונקציה בדיוק רצה בבדיקות היחידה ובשרת.
 *
 * העיקרון: `asset_type` נקבע ראשון, והוא שקובע אילו שדות נדרשים. שדה שלא
 * נשלח כלל — כי הפקד שלו לא מוצג לסוג הנכס שנבחר — שקול לשדה ריק, ולא לשגיאה.
 */

export type ParseResult<T> = { error: string } | { values: T };

const CITY_VALUES = CITIES as unknown as [string, ...string[]];
const ASSET_TYPE_VALUES = ASSET_TYPES as unknown as [AssetType, ...AssetType[]];

const formText = z
  .string()
  .optional()
  .transform((value) => (value ?? '').trim());

/** שדה מספרי לא חובה — מחרוזת ריקה נחשבת "לא הוזן". */
const optionalNumber = (min: number, max: number) =>
  formText
    .transform((value) => (value === '' ? null : Number(value)))
    .refine((value) => value === null || (Number.isFinite(value) && value >= min && value <= max), {
      message: `הערך חייב להיות בין ${min} ל-${max}`,
    });

/** תאריך לא חובה, בפורמט של שדה date בדפדפן. */
const optionalDate = (label: string) =>
  formText
    .transform((value) => (value === '' ? null : value))
    .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: `${label} — תאריך לא תקין`,
    });

const optionalText = (max: number) =>
  formText
    .refine((value) => value.length <= max, { message: `הטקסט ארוך מ-${max} תווים` })
    .transform((value) => value || null);

const optionalUuid = formText
  .transform((value) => (value === '' ? null : value))
  .refine((value) => value === null || z.uuid().safeParse(value).success, {
    message: 'בחירה לא תקינה',
  });

const optionalEnum = <T extends string>(values: readonly T[], message: string) =>
  formText
    .transform((value) => (value === '' ? null : value))
    .refine((value) => value === null || (values as readonly string[]).includes(value), { message })
    .transform((value) => value as T | null);

const conditionSchema = z.enum(
  ['new', 'renovated', 'maintained', 'needs_renovation', 'pre_urban_renewal'],
  { message: 'מצב הנכס אינו מהרשימה' },
);

// ---------------------------------------------------------------------------
//  צעד 1 — "מה יש לי"
// ---------------------------------------------------------------------------

/** טווח שטח סביר לכל קבוצת נכסים, במ״ר. קרקע נמדדת בדונמים ולכן הטווח רחב. */
export const SIZE_RANGE: Record<AssetGroup, [number, number]> = {
  residential: [15, 2000],
  commercial: [5, 50_000],
  land: [50, 1_000_000],
  unit: [2, 500],
};

/** מה שנשאל בכל סוג נכס: מיקום, זיהוי, מצב משפטי וחלון פינוי. */
const baseDetailsSchema = z.object({
  asset_type: z.enum(ASSET_TYPE_VALUES, { message: 'יש לבחור סוג נכס' }),
  city: z.enum(CITY_VALUES, { message: 'יש לבחור עיר' }),
  neighborhood_id: optionalUuid,
  street: optionalText(80),
  house_number: optionalText(12),
  size_sqm: z.coerce
    .number({ message: 'יש למלא את השטח במ״ר' })
    .int({ message: 'השטח חייב להיות מספר שלם' }),

  gush: optionalNumber(1, 99_999),
  helka: optionalNumber(1, 99_999),
  tat_helka: optionalNumber(1, 9_999),
  right_type: z.enum(['ownership', 'lease_rmi', 'housing_company'], {
    message: 'יש לבחור סוג זכות',
  }),
  lease_contract_no: optionalText(40),

  mortgage_balance: optionalNumber(0, 100_000_000),
  tenant_lease_ends: optionalDate('תום חוזה השכירות'),

  available_from: optionalDate('תחילת חלון הפינוי'),
  available_until: optionalDate('סוף חלון הפינוי'),
  availability_flex_months: z.coerce
    .number({ message: 'גמישות המועד אינה תקינה' })
    .int({ message: 'גמישות המועד אינה תקינה' })
    .min(0, 'גמישות המועד אינה תקינה')
    .max(12, 'גמישות המועד אינה תקינה'),
});

const residentialSchema = z.object({
  rooms: z.coerce
    .number({ message: 'יש לבחור מספר חדרים' })
    .min(1, 'יש לבחור מספר חדרים')
    .max(20, 'מספר החדרים גבוה מדי'),
  floor: optionalNumber(-5, 80),
  total_floors: optionalNumber(1, 80),
  parking_count: z.coerce
    .number({ message: 'מספר החניות אינו תקין' })
    .int({ message: 'מספר החניות אינו תקין' })
    .min(0, 'מספר החניות אינו תקין')
    .max(10, 'מספר החניות אינו תקין'),
  building_year: optionalNumber(1900, new Date().getFullYear() + 5),
  condition: conditionSchema,
  urban_renewal_status: z.enum(
    ['none', 'tama38_planned', 'tama38_approved', 'pinui_binui_planned', 'pinui_binui_approved'],
    { message: 'מצב ההתחדשות העירונית אינו מהרשימה' },
  ),
});

const commercialSchema = z.object({
  commercial_use: optionalEnum(COMMERCIAL_USES, 'ייעוד לא מוכר'),
  floor: optionalNumber(-5, 80),
  parking_count: z.coerce
    .number({ message: 'מספר החניות אינו תקין' })
    .int({ message: 'מספר החניות אינו תקין' })
    .min(0, 'מספר החניות אינו תקין')
    .max(10, 'מספר החניות אינו תקין'),
  condition: conditionSchema,
  annual_yield: optionalNumber(0, 99.99),
});

const landSchema = z.object({
  land_zoning: optionalEnum(LAND_ZONINGS, 'ייעוד תכנוני לא מוכר'),
  building_rights_sqm: optionalNumber(0, 1_000_000),
});

const unitSchema = z.object({
  floor: optionalNumber(-5, 80),
  condition: conditionSchema,
});

const checkbox = (formData: FormData, name: string) => formData.get(name) === 'on';

/**
 * ממיר את טופס צעד 1 לשורת עדכון מלאה.
 * העדכון תמיד כולל את כל העמודות תלויות־הסוג, גם כשהן ריקות — כך שמעבר
 * מדירה לקרקע מנקה את החדרים והמעלית במקום להשאיר שאריות מהסוג הקודם.
 */
export function parseDetailsForm(formData: FormData): ParseResult<Record<string, unknown>> {
  const raw = Object.fromEntries(formData);
  const base = baseDetailsSchema.safeParse(raw);
  if (!base.success) return { error: base.error.issues[0].message };

  const data = base.data;
  const group = assetGroup(data.asset_type);

  const [minSize, maxSize] = SIZE_RANGE[group];
  if (data.size_sqm < minSize || data.size_sqm > maxSize) {
    return { error: `השטח חייב להיות בין ${minSize} ל-${maxSize} מ״ר` };
  }

  if (data.available_from && data.available_until && data.available_from > data.available_until) {
    return { error: 'תאריך תחילת חלון הפינוי מאוחר מתאריך הסיום.' };
  }

  if (data.right_type === 'lease_rmi' && !data.lease_contract_no) {
    return { error: 'לחכירה מרשות מקרקעי ישראל צריך למלא את מספר חוזה החכירה.' };
  }

  const hasMortgage = checkbox(formData, 'has_mortgage');
  const hasTenant = checkbox(formData, 'has_tenant');

  // ברירות מחדל לעמודות שאינן רלוונטיות לסוג הנכס הנוכחי
  const values: Record<string, unknown> = {
    asset_type: data.asset_type,
    city: data.city,
    neighborhood_id: data.neighborhood_id,
    street: data.street,
    house_number: data.house_number,
    size_sqm: data.size_sqm,

    gush: data.gush,
    helka: data.helka,
    tat_helka: data.tat_helka,
    right_type: data.right_type,
    lease_contract_no: data.right_type === 'lease_rmi' ? data.lease_contract_no : null,

    has_mortgage: hasMortgage,
    mortgage_balance: hasMortgage ? data.mortgage_balance : null,
    has_caveats: checkbox(formData, 'has_caveats'),
    has_liens: checkbox(formData, 'has_liens'),
    has_tenant: hasTenant,
    tenant_lease_ends: hasTenant ? data.tenant_lease_ends : null,

    available_from: data.available_from,
    available_until: data.available_until,
    availability_flex_months: data.availability_flex_months,

    rooms: null,
    floor: null,
    total_floors: null,
    has_elevator: false,
    has_parking: false,
    parking_count: 0,
    has_balcony: false,
    has_safe_room: false,
    has_storage: false,
    building_year: null,
    condition: 'maintained',
    urban_renewal_status: 'none',
    commercial_use: null,
    annual_yield: null,
    land_zoning: null,
    building_rights_sqm: null,
    land_is_fenced: null,
    land_is_vacant: null,
  };

  if (group === 'residential') {
    const parsed = residentialSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const { floor, total_floors: totalFloors, parking_count: parking } = parsed.data;
    if (floor !== null && totalFloors !== null && floor > totalFloors) {
      return { error: 'הקומה גבוהה ממספר הקומות בבניין.' };
    }
    Object.assign(values, parsed.data, {
      // has_parking הוא מה שמנוע ההתאמות קורא, ולכן הוא נגזר תמיד ממספר החניות
      has_parking: parking > 0,
      has_elevator: checkbox(formData, 'has_elevator'),
      has_balcony: checkbox(formData, 'has_balcony'),
      has_safe_room: checkbox(formData, 'has_safe_room'),
      has_storage: checkbox(formData, 'has_storage'),
    });
  } else if (group === 'commercial') {
    const parsed = commercialSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    Object.assign(values, parsed.data, { has_parking: parsed.data.parking_count > 0 });
  } else if (group === 'land') {
    const parsed = landSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    Object.assign(values, parsed.data, {
      land_is_fenced: checkbox(formData, 'land_is_fenced'),
      land_is_vacant: checkbox(formData, 'land_is_vacant'),
    });
  } else {
    const parsed = unitSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    Object.assign(values, parsed.data);
  }

  return { values };
}

// ---------------------------------------------------------------------------
//  צעד 3 — שווי מוצהר ותיאור
// ---------------------------------------------------------------------------

export const valueSchema = z.object({
  asking_value: z.coerce
    .number({ message: 'יש למלא את השווי המוצהר' })
    .int({ message: 'השווי המוצהר חייב להיות מספר שלם' })
    .min(100_000, 'השווי המוצהר נמוך מדי')
    .max(100_000_000, 'השווי המוצהר גבוה מדי'),
  description: z
    .string()
    .trim()
    .max(2000, 'התיאור ארוך מ-2000 תווים')
    .transform((value) => value || null),
});

// ---------------------------------------------------------------------------
//  צעד 4 — "מה אני מחפש"
// ---------------------------------------------------------------------------

const wantedSchema = z.object({
  wanted_min_rooms: optionalNumber(1, 20),
  wanted_max_rooms: optionalNumber(1, 20),
  wanted_min_sqm: optionalNumber(5, 1_000_000),
  wanted_min_floor: optionalNumber(-5, 80),
  wanted_value_min: optionalNumber(0, 100_000_000),
  wanted_value_max: optionalNumber(0, 100_000_000),
  wanted_available_from: optionalDate('תחילת חלון המעבר'),
  wanted_available_until: optionalDate('סוף חלון המעבר'),
  cash_add_max: z.coerce
    .number({ message: 'סכום ההשלמה אינו תקין' })
    .int({ message: 'סכום ההשלמה חייב להיות מספר שלם' })
    .min(0, 'סכום ההשלמה אינו יכול להיות שלילי')
    .max(50_000_000, 'סכום ההשלמה גבוה מדי'),
  cash_receive_min: z.coerce
    .number({ message: 'הסכום שאתה מצפה לקבל אינו תקין' })
    .int({ message: 'הסכום שאתה מצפה לקבל חייב להיות מספר שלם' })
    .min(0, 'הסכום שאתה מצפה לקבל אינו יכול להיות שלילי')
    .max(50_000_000, 'הסכום שאתה מצפה לקבל גבוה מדי'),
});

export interface WantedValues extends z.infer<typeof wantedSchema> {
  wanted_asset_types: AssetType[];
  wanted_cities: string[];
  /** כפי שנשלחו מהטופס. הסינון מול השכונות שקיימות באמת נעשה בשרת. */
  wanted_neighborhood_ids: string[];
  must_haves: string[];
  soft_prefs: SoftPrefs;
}

/** 0–3 לכל העדפה רכה. ערך שאינו בטווח נחשב 0. */
export function parseSoftPrefs(formData: FormData): SoftPrefs {
  const prefs: SoftPrefs = {};
  for (const key of SOFT_PREF_KEYS) {
    const raw = Number(formData.get(`soft_${key}`) ?? 0);
    const weight = Number.isInteger(raw) && raw >= 0 && raw <= 3 ? raw : 0;
    prefs[key] = weight as 0 | 1 | 2 | 3;
  }
  return prefs;
}

export function parseWantedForm(formData: FormData): ParseResult<WantedValues> {
  const parsed = wantedSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const assetTypes = formData
    .getAll('wanted_asset_types')
    .map(String)
    .filter((value): value is AssetType => (ASSET_TYPES as string[]).includes(value));
  if (!assetTypes.length) {
    return { error: 'יש לבחור לפחות סוג נכס אחד שתרצה לקבל בתמורה.' };
  }

  const cities = formData.getAll('wanted_cities').map(String).filter(Boolean);
  if (!cities.length) {
    return { error: 'יש לבחור לפחות אזור אחד שבו תרצה לקבל נכס.' };
  }

  const {
    wanted_min_rooms: minRooms,
    wanted_max_rooms: maxRooms,
    wanted_value_min: minValue,
    wanted_value_max: maxValue,
    wanted_available_from: windowFrom,
    wanted_available_until: windowUntil,
  } = parsed.data;

  if (minRooms !== null && maxRooms !== null && minRooms > maxRooms) {
    return { error: 'מספר החדרים המינימלי גדול מהמקסימלי.' };
  }
  if (minValue !== null && maxValue !== null && minValue > maxValue) {
    return { error: 'השווי המינימלי המבוקש גבוה מהמקסימלי.' };
  }
  if (windowFrom && windowUntil && windowFrom > windowUntil) {
    return { error: 'תאריך תחילת חלון המעבר מאוחר מתאריך הסיום.' };
  }

  return {
    values: {
      ...parsed.data,
      wanted_asset_types: assetTypes,
      wanted_cities: cities,
      wanted_neighborhood_ids: formData
        .getAll('wanted_neighborhood_ids')
        .map(String)
        .filter(Boolean),
      must_haves: formData.getAll('must_haves').map(String).filter(Boolean),
      soft_prefs: parseSoftPrefs(formData),
    },
  };
}
