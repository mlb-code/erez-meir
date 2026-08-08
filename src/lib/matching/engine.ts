import type { PropertyCondition, PropertyFeature } from '@/lib/types';
import { MATCHING_CONFIG } from './config';

/**
 * ===========================================================================
 *  מנוע ההתאמות
 * ===========================================================================
 *
 *  הבעיה ממודלת כגרף מכוון:
 *    • כל מודעה פעילה היא צומת.
 *    • קיימת קשת מ-A ל-B אם ורק אם הדירה של B עונה על "מה אני מחפש" של A.
 *
 *  התאמה ישירה = מעגל באורך 2 (גם A→B וגם B→A).
 *  שרשרת       = מעגל באורך 3 עד 5, שבו כל משתתף עובר לדירה של הבא אחריו,
 *                והאחרון עובר לדירה של הראשון.
 *
 *  הכול רץ בזיכרון. עבור סדר גודל של MVP (אלפי מודעות) זה מספיק בהחלט.
 *  TODO (הרחבה עתידית): אם מספר המודעות יגדל בסדר גודל, לצמצם מראש את מרחב
 *  החיפוש לפי עיר וטווח שווי לפני בניית רשימת השכנויות.
 */

/** השדות היחידים מתוך מודעה שהמנוע צריך כדי להחליט. */
export interface MatchableListing {
  id: string;
  city: string;
  rooms: number;
  size_sqm: number;
  asking_value: number;
  has_elevator: boolean;
  has_parking: boolean;
  has_balcony: boolean;
  has_safe_room: boolean;
  condition: PropertyCondition;
  wanted_cities: string[];
  wanted_min_rooms: number | null;
  wanted_max_rooms: number | null;
  wanted_min_sqm: number | null;
  must_haves: PropertyFeature[];
  cash_add_max: number;
  cash_receive_min: number;
}

/** מעגל שהמנוע מצא, מוכן לשמירה. */
export interface ComputedMatch {
  match_type: 'direct' | 'chain';
  /** מסודר לפי כיוון המעבר, ומתחיל תמיד במזהה הקטן ביותר במעגל. */
  chain_listing_ids: string[];
  score: number;
}

// ---------------------------------------------------------------------------
//  תנאי הסף של קשת אחת
// ---------------------------------------------------------------------------

/** האם הדירה מספקת מאפיין מסוים. */
export function hasFeature(listing: MatchableListing, feature: PropertyFeature): boolean {
  switch (feature) {
    case 'elevator':
      return listing.has_elevator;
    case 'parking':
      return listing.has_parking;
    case 'balcony':
      return listing.has_balcony;
    case 'safe_room':
      return listing.has_safe_room;
    case 'renovated':
      return listing.condition === 'renovated' || listing.condition === 'new';
  }
}

/**
 * הפער הכספי במעבר מ-`from` אל `to`.
 * חיובי  = בעל הדירה `from` צריך להוסיף מכיסו (הדירה שהוא מקבל יקרה יותר).
 * שלילי  = הוא אמור לקבל השלמה (הדירה שהוא מקבל זולה יותר).
 */
export function cashGap(from: MatchableListing, to: MatchableListing): number {
  return cashGapBetween(from.asking_value, to.asking_value);
}

/** אותה נוסחה, כשבידינו רק שני הסכומים. */
export function cashGapBetween(fromValue: number, toValue: number): number {
  return toValue - fromValue;
}

/**
 * בדיקת גמישות המזומן של `from` מול הדירה שהוא עומד לקבל.
 *  • צריך להוסיף  → ההוספה לא תעלה על cash_add_max
 *  • אמור לקבל     → ההשלמה לא תרד מ-cash_receive_min
 *  • שווי זהה      → אין מה לבדוק
 */
export function cashFlowAllowed(from: MatchableListing, to: MatchableListing): boolean {
  const gap = cashGap(from, to);
  if (gap > 0) return gap <= from.cash_add_max;
  if (gap < 0) return -gap >= from.cash_receive_min;
  return true;
}

/** האם הדירה של `to` עונה על "מה אני מחפש" של `from`. */
export function edgeExists(from: MatchableListing, to: MatchableListing): boolean {
  if (from.id === to.id) return false;

  // 1. עיר
  if (!from.wanted_cities.includes(to.city)) return false;

  // 2. חדרים ושטח
  if (from.wanted_min_rooms !== null && to.rooms < from.wanted_min_rooms) return false;
  if (from.wanted_max_rooms !== null && to.rooms > from.wanted_max_rooms) return false;
  if (from.wanted_min_sqm !== null && to.size_sqm < from.wanted_min_sqm) return false;

  // 3. מאפיינים שחובה שיהיו
  for (const feature of from.must_haves) {
    if (!hasFeature(to, feature)) return false;
  }

  // 4. פער מזומן
  return cashFlowAllowed(from, to);
}

// ---------------------------------------------------------------------------
//  גרף ומעגלים
// ---------------------------------------------------------------------------

/** רשימת שכנויות: לכל מודעה, האינדקסים של המודעות שהיא "רוצה". */
export function buildAdjacency(listings: MatchableListing[]): number[][] {
  return listings.map((from) => {
    const neighbours: number[] = [];
    listings.forEach((to, index) => {
      if (edgeExists(from, to)) neighbours.push(index);
    });
    return neighbours;
  });
}

/**
 * מוצא את כל המעגלים המכוונים באורך 2 עד `maxLength`.
 *
 * נרמול: המודעות ממוינות לפי מזהה, וכל מעגל נמצא רק כשמתחילים מהאיבר
 * הקטן ביותר שבו (ה-DFS לא נכנס לצמתים עם אינדקס נמוך מנקודת ההתחלה).
 * כך אותו מעגל לא מוחזר פעמיים בסיבובים שונים.
 * שני כיווני מעבר שונים נחשבים לשתי התאמות שונות — כי הם באמת עסקאות שונות.
 */
export function findCycles(
  listings: MatchableListing[],
  maxLength: number = MATCHING_CONFIG.MAX_CHAIN_LENGTH,
): string[][] {
  const sorted = [...listings].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const adjacency = buildAdjacency(sorted);
  const cycles: string[][] = [];
  const path: number[] = [];
  const onPath = new Set<number>();

  const walk = (start: number, current: number) => {
    for (const next of adjacency[current]) {
      if (next === start) {
        // סגרנו מעגל. מעגל של אחד לא קיים (edgeExists פוסל i→i).
        // הבדיקה הזו קודמת למגבלת האורך, כדי שמעגל שסוגר בדיוק ב-maxLength ייספר.
        if (path.length >= 2) {
          cycles.push(path.map((index) => sorted[index].id));
        }
        continue;
      }
      // אין מקום לחוליה נוספת.
      if (path.length >= maxLength) continue;
      // כל צומת קטן מנקודת ההתחלה כבר טופל בסיבוב משלו.
      if (next < start || onPath.has(next)) continue;

      path.push(next);
      onPath.add(next);
      walk(start, next);
      path.pop();
      onPath.delete(next);
    }
  };

  for (let start = 0; start < sorted.length; start++) {
    path.push(start);
    onPath.add(start);
    walk(start, start);
    path.pop();
    onPath.delete(start);
  }

  return cycles;
}

// ---------------------------------------------------------------------------
//  ציון
// ---------------------------------------------------------------------------

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * ציון 0–100 למעגל, לפי שלושה רכיבים:
 *   1. קרבת שווי — כמה מזומן צריך לעבור בכל מעבר. פער קטן = ציון גבוה.
 *   2. עודף על הקריטריונים — הדירה שכל אחד מקבל טובה מהמינימום שביקש.
 *   3. אורך המעגל — התאמה ישירה מקבלת בונוס, כל חוליה נוספת גוררת קנס.
 * הנוסחה מכוילת דרך הקבועים ב-config.ts.
 */
export function scoreCycle(cycle: MatchableListing[]): number {
  const {
    BASE_SCORE,
    DIRECT_BONUS,
    CHAIN_LENGTH_PENALTY,
    VALUE_PROXIMITY_WEIGHT,
    VALUE_GAP_ZERO_RATIO,
    SURPLUS_WEIGHT,
    ROOMS_SURPLUS_CAP,
    SQM_SURPLUS_CAP,
  } = MATCHING_CONFIG;

  const length = cycle.length;
  let proximitySum = 0;
  let surplusSum = 0;

  for (let i = 0; i < length; i++) {
    const from = cycle[i];
    const to = cycle[(i + 1) % length];

    // 1. קרבת שווי
    const ratio = Math.abs(cashGap(from, to)) / Math.max(from.asking_value, 1);
    proximitySum += clamp01(1 - ratio / VALUE_GAP_ZERO_RATIO);

    // 2. עודף על הקריטריונים
    const roomsSurplus =
      from.wanted_min_rooms === null
        ? 0
        : clamp01((to.rooms - from.wanted_min_rooms) / ROOMS_SURPLUS_CAP);
    const sqmSurplus =
      from.wanted_min_sqm === null
        ? 0
        : clamp01((to.size_sqm - from.wanted_min_sqm) / SQM_SURPLUS_CAP);
    surplusSum += (roomsSurplus + sqmSurplus) / 2;
  }

  // 3. אורך המעגל
  const lengthTerm = length === 2 ? DIRECT_BONUS : -(length - 2) * CHAIN_LENGTH_PENALTY;

  const score =
    BASE_SCORE +
    (proximitySum / length) * VALUE_PROXIMITY_WEIGHT +
    (surplusSum / length) * SURPLUS_WEIGHT +
    lengthTerm;

  return Math.round(Math.min(100, Math.max(0, score)));
}

// ---------------------------------------------------------------------------
//  נקודת הכניסה
// ---------------------------------------------------------------------------

/**
 * מחשב את כל ההתאמות מתוך אוסף המודעות הפעילות.
 * מוחזר ממוין לפי ציון יורד.
 */
export function computeMatches(
  listings: MatchableListing[],
  maxLength: number = MATCHING_CONFIG.MAX_CHAIN_LENGTH,
): ComputedMatch[] {
  const byId = new Map(listings.map((listing) => [listing.id, listing]));

  return findCycles(listings, maxLength)
    .map((ids) => {
      const cycle = ids.map((id) => byId.get(id)!);
      return {
        match_type: ids.length === 2 ? ('direct' as const) : ('chain' as const),
        chain_listing_ids: ids,
        score: scoreCycle(cycle),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * מחזיר את שרשרת התנועות של מעגל, לתצוגה: מי עובר לדירה של מי,
 * וכמה כסף עובר בכל מעבר.
 */
export function describeCycle(cycle: MatchableListing[]) {
  return cycle.map((from, index) => {
    const to = cycle[(index + 1) % cycle.length];
    return { from, to, cash: cashGap(from, to) };
  });
}
