import { FEATURE_LABELS } from './constants';
import { formatCurrency, formatRooms } from './format';
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
  parts.push(listing.wanted_cities.length ? listing.wanted_cities.join(' / ') : 'כל אזור');
  parts.push(describeWantedRooms(listing));
  if (listing.wanted_min_sqm !== null) parts.push(`לפחות ${listing.wanted_min_sqm} מ״ר`);
  if (listing.must_haves.length) {
    parts.push(listing.must_haves.map((feature) => FEATURE_LABELS[feature]).join(', '));
  }
  return parts.join(' · ');
}

/** רשימת המאפיינים שקיימים בפועל בדירה. */
export function listingFeatures(listing: Listing): string[] {
  const features: string[] = [];
  if (listing.has_elevator) features.push('מעלית');
  if (listing.has_parking) features.push('חניה');
  if (listing.has_balcony) features.push('מרפסת');
  if (listing.has_safe_room) features.push('ממ״ד');
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
