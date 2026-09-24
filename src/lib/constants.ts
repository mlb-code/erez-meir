import type {
  ListingStatus,
  PropertyCondition,
  PropertyFeature,
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
