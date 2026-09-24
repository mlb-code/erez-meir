import type {
  AssetType,
  ListingStatus,
  PropertyCondition,
  PropertyFeature,
  RightType,
  UrbanRenewalStatus,
} from './types';

/** ערים שהפלטפורמה תומכת בהן ב-MVP (גוש דן והשרון). */
export const CITIES = [
  'תל אביב',
  'רמת גן',
  'גבעתיים',
  'הרצליה',
  'רמת השרון',
  'רעננה',
  'פתח תקווה',
  'ראשון לציון',
] as const;

/** אפשרויות מספר החדרים, כולל חצאים. */
export const ROOM_OPTIONS = [
  1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 8,
] as const;

export const CONDITION_LABELS: Record<PropertyCondition, string> = {
  new: 'חדשה מקבלן',
  renovated: 'משופצת',
  maintained: 'שמורה',
  needs_renovation: 'דורשת שיפוץ',
  pre_urban_renewal: 'לפני התחדשות עירונית',
};

export const URBAN_RENEWAL_LABELS: Record<UrbanRenewalStatus, string> = {
  none: 'ללא',
  tama38_planned: 'תמ״א 38 בתכנון',
  tama38_approved: 'תמ״א 38 מאושרת',
  pinui_binui_planned: 'פינוי־בינוי בתכנון',
  pinui_binui_approved: 'פינוי־בינוי מאושר',
};

export const FEATURE_LABELS: Record<PropertyFeature, string> = {
  elevator: 'מעלית',
  parking: 'חניה',
  balcony: 'מרפסת',
  safe_room: 'ממ״ד',
  renovated: 'משופצת',
  no_tenant: 'ללא שוכר',
  no_caveats: 'ללא הערות אזהרה',
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  draft: 'טיוטה',
  pending_ownership: 'ממתינה לאימות בעלות',
  ownership_rejected: 'אימות הבעלות נדחה',
  active: 'פעילה',
  closing: 'בסגירה',
  in_negotiation: 'במשא ומתן',
  swapped: 'הוחלפה',
  archived: 'בארכיון',
};

export const FEATURE_OPTIONS: { value: PropertyFeature; label: string }[] = (
  ['elevator', 'parking', 'balcony', 'safe_room', 'renovated', 'no_tenant', 'no_caveats'] as const
).map((value) => ({ value, label: FEATURE_LABELS[value] }));

/** ההסבר המשפטי שמופיע בסוף כל התאמה. */
export const LEGAL_DISCLAIMER =
  'חליפין מבצעת שידוך בלבד ואינה צד בעסקה. היא אינה מטפלת בתשלומים, במשכנתאות או בהיבטים משפטיים. ' +
  'החלפת דירות מתבצעת בפועל כשתי עסקאות מכר מקבילות, בליווי עורכי הדין של כל אחד מהצדדים.';

/**
 * מצבי מעגל שבהם הצ'אט ופרטי הקשר פתוחים. מקביל ל-private.open_match_states() במסד.
 * מעברי: all_interested נשאר עד שזרימת אישור ההפגשה (D4) תהיה בכל המסכים.
 */
export const OPEN_MATCH_STATES = ['all_interested', 'meeting_confirmed', 'in_negotiation', 'closing', 'swapped'] as const;
export const isOpenMatchState = (status: string): boolean => (OPEN_MATCH_STATES as readonly string[]).includes(status);

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  apartment: 'דירה', penthouse: 'פנטהאוז', garden_apartment: 'דירת גן', house: 'בית פרטי',
  office: 'משרד', shop: 'חנות', warehouse: 'מחסן', industrial: 'מבנה תעשייה',
  land: 'קרקע', parking: 'חניה', storage: 'מחסן (יחידה)',
};
export const RESIDENTIAL_ASSET_TYPES: ReadonlySet<AssetType> = new Set(['apartment', 'penthouse', 'garden_apartment', 'house']);

/**
 * קבוצות סוגי הנכס. הקבוצה קובעת אילו שדות מופיעים באשף הפרסום (§4.3):
 * לנכס מגורים יש חדרים, לנכס מסחרי יש ייעוד ותשואה, לקרקע יש זכויות בנייה.
 */
export type AssetGroup = 'residential' | 'commercial' | 'land' | 'unit';

export const ASSET_TYPE_GROUPS: { group: AssetGroup; label: string; types: AssetType[] }[] = [
  { group: 'residential', label: 'מגורים', types: ['apartment', 'penthouse', 'garden_apartment', 'house'] },
  { group: 'commercial', label: 'מסחרי', types: ['office', 'shop', 'warehouse', 'industrial'] },
  { group: 'land', label: 'קרקע', types: ['land'] },
  { group: 'unit', label: 'יחידה נלווית', types: ['parking', 'storage'] },
];

export const ASSET_TYPES: AssetType[] = ASSET_TYPE_GROUPS.flatMap((entry) => entry.types);

export function assetGroup(type: AssetType): AssetGroup {
  return ASSET_TYPE_GROUPS.find((entry) => entry.types.includes(type))?.group ?? 'residential';
}

export const isResidentialType = (type: AssetType): boolean => RESIDENTIAL_ASSET_TYPES.has(type);

export const RIGHT_TYPE_LABELS: Record<RightType, string> = {
  ownership: 'בעלות',
  lease_rmi: 'חכירה מרשות מקרקעי ישראל',
  housing_company: 'חברה משכנת',
};

/** ייעוד הנכס המסחרי (§4.3). נשמר כטקסט בעמודה commercial_use. */
export const COMMERCIAL_USES = ['משרד', 'חנות', 'מחסן', 'תעשייה', 'אחר'] as const;

/** ייעוד תכנוני של קרקע. נשמר כטקסט בעמודה land_zoning. */
export const LAND_ZONINGS = [
  'מגורים',
  'מסחר',
  'תעסוקה ותעשייה',
  'חקלאי',
  'מעורב — מגורים ומסחר',
  'ציבורי',
  'ללא ייעוד מאושר',
] as const;

/** גמישות בחלון הפינוי, בחודשים. */
export const AVAILABILITY_FLEX_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'ללא גמישות' },
  { value: 1, label: 'עד חודש לכאן או לכאן' },
  { value: 3, label: 'עד שלושה חודשים' },
  { value: 6, label: 'עד חצי שנה' },
];

export const SOFT_PREF_KEYS = [
  'elevator',
  'parking',
  'balcony',
  'safe_room',
  'new_building',
  'renovated',
  'urban_renewal',
] as const;

export type SoftPrefKey = (typeof SOFT_PREF_KEYS)[number];

export const SOFT_PREF_LABELS: Record<SoftPrefKey, string> = {
  elevator: 'מעלית',
  parking: 'חניה',
  balcony: 'מרפסת',
  safe_room: 'ממ״ד',
  new_building: 'בניין חדש',
  renovated: 'משופץ',
  urban_renewal: 'התחדשות עירונית',
};

/** 0–3 "כוכבים" לכל העדפה רכה. משפיע על הציון, לא על הסינון (§4.3). */
export const SOFT_PREF_LEVELS: { value: 0 | 1 | 2 | 3; label: string }[] = [
  { value: 0, label: 'לא משנה' },
  { value: 1, label: 'קצת חשוב' },
  { value: 2, label: 'חשוב' },
  { value: 3, label: 'חשוב מאוד' },
];

/**
 * העמודות שמנוע ההתאמות קורא (MatchableListing). מקור יחיד לכל מי ששולף
 * מודעות עבור המנוע — האפליקציה, `verify:matches` ו-`check:e2e`. עמודה שחסרה
 * מהשליפה נקראת כ"לא הוגדר", ולכן היסחפות בין הרשימות משנה תוצאות בשקט.
 */
export const ENGINE_LISTING_FIELDS = [
  'id', 'owner_id', 'asset_type', 'city', 'neighborhood_id', 'rooms', 'size_sqm', 'floor',
  'asking_value', 'has_elevator', 'has_parking', 'has_balcony', 'has_safe_room', 'condition',
  'building_year', 'urban_renewal_status', 'has_mortgage', 'has_caveats', 'has_liens', 'has_tenant',
  'available_from', 'available_until', 'availability_flex_months', 'locked_until',
  'wanted_asset_types', 'wanted_cities', 'wanted_neighborhood_ids', 'wanted_min_rooms',
  'wanted_max_rooms', 'wanted_min_sqm', 'wanted_min_floor', 'wanted_value_min', 'wanted_value_max',
  'wanted_available_from', 'wanted_available_until', 'must_haves', 'soft_prefs',
  'cash_add_max', 'cash_receive_min',
] as const;

export const ENGINE_LISTING_SELECT = ENGINE_LISTING_FIELDS.join(', ');

/**
 * מה שמנוע ההתאמות אמור למצוא בנתוני הדמו של supabase/seed.sql.
 * שינוי בנתוני הדמו שמזיז את המספרים האלה הוא באג בדמו, לא בתוצאה.
 */
export const DEMO_EXPECTED_MATCHES = { direct: 3, chains3: 2, chains4: 1 } as const;
