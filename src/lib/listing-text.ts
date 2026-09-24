import {
  ASSET_TYPE_LABELS,
  FEATURE_LABELS,
  RESIDENTIAL_ASSET_TYPES,
  SOFT_PREF_KEYS,
  SOFT_PREF_LABELS,
} from './constants';
import { formatCurrency, formatDate, formatRooms } from './format';
import type { Listing } from './types';

/** "מוכן להוסיף עד 300 אלף ₪" / "מצפה לקבל לפחות 500 אלף ₪" / "החלפה בשווי דומה" */
export function describeCashFlexibility(listing: Pick<Listing, 'cash_add_max' | 'cash_receive_min'>): string {
  const parts: string[] = [];
  if (listing.cash_add_max > 0) {
    parts.push(`מוכן להוסיף עד ${formatCurrency(listing.cash_add_max)}`);
  }
  if (listing.cash_receive_min > 0) {
    parts.push(`מצפה לקבל לפחות ${formatCurrency(listing.cash_receive_min)}`);
  }
  return parts.length ? parts.join(' · ') : 'החלפה בשווי דומה, ללא השלמה כספית';
}

/**
 * תיאור טווח החדרים המבוקש.
 * הניסוח נמנע במכוון ממקף בין שני מספרים ("3–3.5"), כי בהקשר עברי הוא
 * מתהפך ויזואלית ונקרא הפוך. "3 עד 3.5 חדרים" תמיד נקרא נכון.
 */
export function describeWantedRooms(listing: Pick<Listing, 'wanted_min_rooms' | 'wanted_max_rooms'>): string {
  const { wanted_min_rooms: min, wanted_max_rooms: max } = listing;
  if (min !== null && max !== null) {
    return min === max ? formatRooms(min) : `${min} עד ${max} חדרים`;
  }
  if (min !== null) return `לפחות ${formatRooms(min)}`;
  if (max !== null) return `עד ${formatRooms(max)}`;
  return 'כל מספר חדרים';
}

/** שורת סיכום קצרה של "מה אני מחפש", לשימוש בכרטיס בלוח. */
export function describeWantedSummary(listing: Listing): string {
  const parts: string[] = [];
  parts.push(describeWantedAssetTypes(listing));
  parts.push(listing.wanted_cities.length ? listing.wanted_cities.join(' / ') : 'כל אזור');
  if (wantsResidential(listing)) parts.push(describeWantedRooms(listing));
  if (listing.wanted_min_sqm !== null) parts.push(`לפחות ${listing.wanted_min_sqm} מ״ר`);
  if (listing.must_haves.length) {
    parts.push(listing.must_haves.map((feature) => FEATURE_LABELS[feature]).join(', '));
  }
  return parts.join(' · ');
}

/** האם המבוקש כולל בכלל נכס מגורים — קובע אם להציג חדרים ב"מה אני מחפש". */
export function wantsResidential(listing: Pick<Listing, 'wanted_asset_types'>): boolean {
  const types = listing.wanted_asset_types?.length ? listing.wanted_asset_types : ['apartment' as const];
  return types.some((type) => RESIDENTIAL_ASSET_TYPES.has(type));
}

/** "דירה / דירת גן" — סוגי הנכס המבוקשים. */
export function describeWantedAssetTypes(listing: Pick<Listing, 'wanted_asset_types'>): string {
  const types = listing.wanted_asset_types?.length ? listing.wanted_asset_types : ['apartment' as const];
  return types.map((type) => ASSET_TYPE_LABELS[type]).join(' / ');
}

/** רשימת המאפיינים שקיימים בפועל בנכס. */
export function listingFeatures(listing: Listing): string[] {
  const features: string[] = [];
  if (listing.has_elevator) features.push('מעלית');
  if (listing.parking_count > 1) features.push(`${listing.parking_count} חניות`);
  else if (listing.has_parking) features.push('חניה');
  if (listing.has_balcony) features.push('מרפסת');
  if (listing.has_safe_room) features.push('ממ״ד');
  if (listing.has_storage) features.push('מחסן');
  return features;
}

/** "רחוב הרצל 4, שכונת X, תל אביב" — מדלג על חלקים חסרים. */
export function describeAddress(listing: Listing): string {
  return [listing.street, listing.neighborhood, listing.city].filter(Boolean).join(', ');
}

/** תיאור מילולי של תנועת כסף בקשת אחת של מעגל. */
export function describeCash(cash: number): string {
  if (cash === 0) return 'ללא השלמה כספית';
  return cash > 0 ? `משלים ${formatCurrency(cash)}` : `מקבל ${formatCurrency(-cash)}`;
}

/** "3 חדרים" לדירה; "חנות" / "קרקע" לנכס שאינו מגורים. */
export function listingKind(listing: Pick<Listing, 'rooms' | 'asset_type'>): string {
  const type = listing.asset_type ?? 'apartment';
  return RESIDENTIAL_ASSET_TYPES.has(type) && listing.rooms !== null ? formatRooms(listing.rooms) : ASSET_TYPE_LABELS[type];
}

/** "3 חדרים בתל אביב" לדירה; "חנות ברמת גן" לנכס אחר. */
export function listingTitle(listing: Pick<Listing, 'rooms' | 'city' | 'asset_type'>): string {
  return `${listingKind(listing)} ב${listing.city}`;
}

/** "מתאריך 1 במרץ 2027 עד 1 ביוני 2027, בגמישות של עד שלושה חודשים" */
export function describeAvailability(
  listing: Pick<Listing, 'available_from' | 'available_until' | 'availability_flex_months'>,
): string {
  const { available_from: from, available_until: until } = listing;
  if (!from && !until) return 'לא הוגדר';

  const range = from && until
    ? `${formatDate(from)} עד ${formatDate(until)}`
    : from
      ? `מ-${formatDate(from)}`
      : `עד ${formatDate(until!)}`;

  const flex = listing.availability_flex_months;
  return flex > 0 ? `${range} · גמישות של עד ${describeMonths(flex)}` : range;
}

/** חלון הזמן שבו הבעלים יכול לעבור לנכס החדש. */
export function describeWantedWindow(
  listing: Pick<Listing, 'wanted_available_from' | 'wanted_available_until'>,
): string {
  const { wanted_available_from: from, wanted_available_until: until } = listing;
  if (!from && !until) return 'גמיש';
  if (from && until) return `${formatDate(from)} עד ${formatDate(until)}`;
  return from ? `מ-${formatDate(from)}` : `עד ${formatDate(until!)}`;
}

function describeMonths(months: number): string {
  if (months === 1) return 'חודש';
  if (months === 2) return 'חודשיים';
  return `${months} חודשים`;
}

/**
 * המצב המשפטי המוצהר, לתצוגה בצד הצופה. מחזיר רשימה קצרה:
 * ["משכנתא פתוחה", "יש שוכר עד 1 בינואר 2027"] — ומערך ריק כשהנכס נקי.
 */
export function describeLegalStatus(
  listing: Pick<Listing, 'has_mortgage' | 'has_caveats' | 'has_liens' | 'has_tenant' | 'tenant_lease_ends'>,
): string[] {
  const notes: string[] = [];
  if (listing.has_mortgage) notes.push('משכנתא רשומה');
  if (listing.has_caveats) notes.push('הערות אזהרה');
  if (listing.has_liens) notes.push('עיקולים');
  if (listing.has_tenant) {
    notes.push(
      listing.tenant_lease_ends
        ? `שוכר בנכס, חוזה עד ${formatDate(listing.tenant_lease_ends)}`
        : 'שוכר בנכס',
    );
  }
  return notes;
}

/** "טווח שווי: 3 מיליון ₪ עד 4 מיליון ₪" — או null כשלא הוגדר טווח. */
export function describeWantedValueRange(
  listing: Pick<Listing, 'wanted_value_min' | 'wanted_value_max'>,
): string | null {
  const { wanted_value_min: min, wanted_value_max: max } = listing;
  if (min === null && max === null) return null;
  if (min !== null && max !== null) return `${formatCurrency(min)} עד ${formatCurrency(max)}`;
  return min !== null ? `לפחות ${formatCurrency(min)}` : `עד ${formatCurrency(max)}`;
}

/** ההעדפות הרכות שקיבלו משקל, מהחשובה ביותר ומטה: ["ממ״ד (חשוב מאוד)", …] */
export function describeSoftPrefs(listing: Pick<Listing, 'soft_prefs'>): string[] {
  const prefs = listing.soft_prefs ?? {};
  return SOFT_PREF_KEYS.filter((key) => (prefs[key] ?? 0) > 0)
    .sort((a, b) => (prefs[b] ?? 0) - (prefs[a] ?? 0))
    .map((key) => `${SOFT_PREF_LABELS[key]} ${'★'.repeat(prefs[key] ?? 0)}`);
}
