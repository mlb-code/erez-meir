import type { AssetType, PropertyCondition, PropertyFeature, SoftPrefs, UrbanRenewalStatus } from '@/lib/types';
import { MATCHING_CONFIG } from './config';

/**
 * ===========================================================================
 *  מנוע ההתאמות v2 (איפיון §6)
 * ===========================================================================
 *  גרף מכוון: כל נכס פעיל הוא צומת; קשת A→B קיימת אם הנכס של B עונה על
 *  "מה אני מחפש" של A (מסננים קשיחים, §6.2). התאמה ישירה = מעגל 2,
 *  שרשרת = מעגל 3–5. לכל צד ציון משלו (§6.3); ציון המעגל = החוליה החלשה.
 *
 *  ביצועים: רשימת המועמדים לכל צומת נבנית לפי עיר/שכונה מבוקשת, לא מול כל
 *  הגרף. עד ~15,000 נכסים זה רץ בזיכרון. מעבר לזה — worker נפרד (§6.5).
 */

const RESIDENTIAL: ReadonlySet<AssetType> = new Set(['apartment', 'penthouse', 'garden_apartment', 'house']);

/** השדות שהמנוע צריך. תואם ל-listings / listings_view. */
export interface MatchableListing {
  id: string;
  owner_id?: string;
  asset_type?: AssetType;
  city: string;
  neighborhood_id?: string | null;
  rooms: number;
  size_sqm: number;
  floor?: number | null;
  asking_value: number;
  has_elevator: boolean;
  has_parking: boolean;
  has_balcony: boolean;
  has_safe_room: boolean;
  condition: PropertyCondition;
  building_year?: number | null;
  urban_renewal_status?: UrbanRenewalStatus;
  has_mortgage?: boolean;
  has_caveats?: boolean;
  has_liens?: boolean;
  has_tenant?: boolean;
  available_from?: string | null;
  available_until?: string | null;
  availability_flex_months?: number;
  locked_until?: string | null;
  identity_verified?: boolean;

  wanted_asset_types?: AssetType[];
  wanted_cities: string[];
  wanted_neighborhood_ids?: string[];
  wanted_min_rooms: number | null;
  wanted_max_rooms: number | null;
  wanted_min_sqm: number | null;
  wanted_min_floor?: number | null;
  wanted_value_min?: number | null;
  wanted_value_max?: number | null;
  wanted_available_from?: string | null;
  wanted_available_until?: string | null;
  must_haves: PropertyFeature[];
  soft_prefs?: SoftPrefs;
  cash_add_max: number;
  cash_receive_min: number;
}

export interface ComputedMatch {
  match_type: 'direct' | 'chain';
  /** מסודר לפי כיוון המעבר, מתחיל במזהה הקטן ביותר במעגל. */
  chain_listing_ids: string[];
  /** ציון המעגל — החוליה החלשה + רכיב אורך. */
  score: number;
  /** ציון לכל צד: כמה הדירה שהוא מקבל טובה עבורו. */
  scores: Record<string, number>;
  estimated_close_probability: number;
}

const isResidential = (l: MatchableListing) => RESIDENTIAL.has(l.asset_type ?? 'apartment');
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const DAY = 86_400_000;

// ---------------------------------------------------------------------------
//  מאפיינים
// ---------------------------------------------------------------------------

export function hasFeature(listing: MatchableListing, feature: PropertyFeature): boolean {
  switch (feature) {
    case 'elevator': return listing.has_elevator;
    case 'parking': return listing.has_parking;
    case 'balcony': return listing.has_balcony;
    case 'safe_room': return listing.has_safe_room;
    case 'renovated': return listing.condition === 'renovated' || listing.condition === 'new';
    case 'no_tenant': return !listing.has_tenant;
    case 'no_caveats': return !listing.has_caveats && !listing.has_liens;
  }
}

// ---------------------------------------------------------------------------
//  מזומן
// ---------------------------------------------------------------------------

/** חיובי = `from` משלים מכיסו; שלילי = מקבל השלמה. */
export function cashGap(from: MatchableListing, to: MatchableListing): number {
  return cashGapBetween(from.asking_value, to.asking_value);
}
export function cashGapBetween(fromValue: number, toValue: number): number {
  return toValue - fromValue;
}
export function cashFlowAllowed(from: MatchableListing, to: MatchableListing): boolean {
  const gap = cashGap(from, to);
  if (gap > 0) return gap <= from.cash_add_max;
  if (gap < 0) return -gap >= from.cash_receive_min;
  return true;
}

// ---------------------------------------------------------------------------
//  זמן
// ---------------------------------------------------------------------------

interface Window { from: number; to: number }

/** חלון המסירה של הנכס, מורחב בגמישות שהוצהרה. null = לא הוגדר. */
function availabilityWindow(l: MatchableListing): Window | null {
  if (!l.available_from && !l.available_until) return null;
  const flex = (l.availability_flex_months ?? 0) * 30.4375 * DAY;
  const from = l.available_from ? Date.parse(l.available_from) - flex : -Infinity;
  const to = l.available_until ? Date.parse(l.available_until) + flex : Infinity;
  return { from, to };
}
function wantedWindow(l: MatchableListing): Window | null {
  if (!l.wanted_available_from && !l.wanted_available_until) return null;
  return {
    from: l.wanted_available_from ? Date.parse(l.wanted_available_from) : -Infinity,
    to: l.wanted_available_until ? Date.parse(l.wanted_available_until) : Infinity,
  };
}

/** 0 = אין חפיפה, 1 = החלון של B מכוסה כולו על ידי מה שA רוצה. null = לא נבדק. */
export function timeFit(from: MatchableListing, to: MatchableListing): number | null {
  const want = wantedWindow(from);
  const have = availabilityWindow(to);
  if (!want || !have) return null;
  const overlap = Math.min(want.to, have.to) - Math.max(want.from, have.from);
  if (overlap < 0) return 0;
  const span = Math.min(have.to - have.from, want.to - want.from);
  if (!Number.isFinite(span) || span <= 0) return 1;
  return clamp01(overlap / span);
}

// ---------------------------------------------------------------------------
//  קשת A→B — מסננים קשיחים (§6.2)
// ---------------------------------------------------------------------------

export function edgeExists(from: MatchableListing, to: MatchableListing): boolean {
  if (from.id === to.id) return false;
  if (from.owner_id && to.owner_id && from.owner_id === to.owner_id) return false;

  // 1. סוג נכס
  const wantedTypes = from.wanted_asset_types?.length ? from.wanted_asset_types : ['apartment' as AssetType];
  if (!wantedTypes.includes(to.asset_type ?? 'apartment')) return false;

  // 2. עיר, ואם הוגדרו — שכונות
  if (!from.wanted_cities.includes(to.city)) return false;
  if (from.wanted_neighborhood_ids?.length) {
    if (!to.neighborhood_id || !from.wanted_neighborhood_ids.includes(to.neighborhood_id)) return false;
  }

  // 3. חדרים / שטח / קומה — חדרים וקומה רק לנכס מגורים
  if (isResidential(to)) {
    if (from.wanted_min_rooms !== null && to.rooms < from.wanted_min_rooms) return false;
    if (from.wanted_max_rooms !== null && to.rooms > from.wanted_max_rooms) return false;
    if (from.wanted_min_floor != null && (to.floor ?? 0) < from.wanted_min_floor) return false;
  }
  if (from.wanted_min_sqm !== null && to.size_sqm < from.wanted_min_sqm) return false;

  // 4. חובה שיהיה (כולל ללא שוכר / ללא הערות)
  for (const feature of from.must_haves) if (!hasFeature(to, feature)) return false;

  // 5. שווי: טווח מבוקש + גמישות מזומן
  if (from.wanted_value_min != null && to.asking_value < from.wanted_value_min) return false;
  if (from.wanted_value_max != null && to.asking_value > from.wanted_value_max) return false;
  if (!cashFlowAllowed(from, to)) return false;

  // 6. זמן — חפיפה כלשהי בין החלונות, אם שניהם הוגדרו
  const fit = timeFit(from, to);
  if (fit !== null && fit === 0) return false;

  return true;
}

// ---------------------------------------------------------------------------
//  גרף ומעגלים
// ---------------------------------------------------------------------------

/** נכסים שמשתתפים במנוע: לא נעולים. */
export function eligible(listings: MatchableListing[], now = Date.now()): MatchableListing[] {
  return listings.filter((l) => !l.locked_until || Date.parse(l.locked_until) < now);
}

/** רשימת שכנויות עם סינון מקדים לפי עיר מבוקשת (§6.5). */
export function buildAdjacency(listings: MatchableListing[]): number[][] {
  const byCity = new Map<string, number[]>();
  listings.forEach((l, i) => {
    const bucket = byCity.get(l.city) ?? [];
    bucket.push(i);
    byCity.set(l.city, bucket);
  });
  return listings.map((from) => {
    const out: number[] = [];
    for (const city of from.wanted_cities) {
      for (const j of byCity.get(city) ?? []) if (edgeExists(from, listings[j])) out.push(j);
    }
    return out.sort((a, b) => a - b);
  });
}

/**
 * כל המעגלים המכוונים באורך 2..maxLength, כל אחד פעם אחת,
 * מנורמל להתחיל במזהה הקטן ביותר (ה-DFS לא נכנס לצמתים קטנים מנקודת ההתחלה).
 */
export function findCycles(listings: MatchableListing[], maxLength: number = MATCHING_CONFIG.MAX_CHAIN_LENGTH): string[][] {
  const sorted = [...listings].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const adjacency = buildAdjacency(sorted);
  const cycles: string[][] = [];
  const path: number[] = [];
  const onPath = new Set<number>();

  const walk = (start: number, current: number) => {
    for (const next of adjacency[current]) {
      if (next === start) {
        if (path.length >= 2) cycles.push(path.map((i) => sorted[i].id));
        continue;
      }
      if (path.length >= maxLength) continue;
      if (next < start || onPath.has(next)) continue;
      path.push(next); onPath.add(next);
      walk(start, next);
      path.pop(); onPath.delete(next);
    }
  };

  for (let start = 0; start < sorted.length; start++) {
    path.push(start); onPath.add(start);
    walk(start, start);
    path.pop(); onPath.delete(start);
  }
  return cycles;
}

// ---------------------------------------------------------------------------
//  ציון (§6.3)
// ---------------------------------------------------------------------------

const SOFT_PREF_CHECKS: Record<keyof SoftPrefs, (l: MatchableListing) => boolean> = {
  elevator: (l) => l.has_elevator,
  parking: (l) => l.has_parking,
  balcony: (l) => l.has_balcony,
  safe_room: (l) => l.has_safe_room,
  new_building: (l) => (l.building_year ?? 0) >= new Date().getFullYear() - 10,
  renovated: (l) => l.condition === 'renovated' || l.condition === 'new',
  urban_renewal: (l) => (l.urban_renewal_status ?? 'none') !== 'none',
};

/** כמה הנכס של `to` טוב עבור `from`, 0–100. */
export function sideScore(from: MatchableListing, to: MatchableListing): number {
  const C = MATCHING_CONFIG;

  const ratio = Math.abs(cashGap(from, to)) / Math.max(from.asking_value, 1);
  const proximity = clamp01(1 - ratio / C.VALUE_GAP_ZERO_RATIO);

  const roomsSurplus = from.wanted_min_rooms === null || !isResidential(to) ? 0
    : clamp01((to.rooms - from.wanted_min_rooms) / C.ROOMS_SURPLUS_CAP);
  const sqmSurplus = from.wanted_min_sqm === null ? 0 : clamp01((to.size_sqm - from.wanted_min_sqm) / C.SQM_SURPLUS_CAP);
  const surplus = (roomsSurplus + sqmSurplus) / 2;

  const fit = timeFit(from, to);
  const time = fit === null ? 0.5 : fit;               // לא הוגדר — ניטרלי

  const prefs = from.soft_prefs ?? {};
  let weightSum = 0, hitSum = 0;
  for (const [key, weight] of Object.entries(prefs) as [keyof SoftPrefs, number][]) {
    if (!weight) continue;
    weightSum += weight;
    if (SOFT_PREF_CHECKS[key]?.(to)) hitSum += weight;
  }
  const soft = weightSum === 0 ? 0.5 : hitSum / weightSum;   // אין העדפות — ניטרלי

  let legal = C.LEGAL_CLEAN_WEIGHT;
  if (to.has_mortgage) legal -= C.LEGAL_PENALTY_MORTGAGE;
  if (to.has_tenant) legal -= C.LEGAL_PENALTY_TENANT;
  if (to.has_caveats) legal -= C.LEGAL_PENALTY_CAVEATS;
  if (to.has_liens) legal -= C.LEGAL_PENALTY_LIENS;

  const total = C.SIDE_BASE + proximity * C.VALUE_PROXIMITY_WEIGHT + surplus * C.SURPLUS_WEIGHT
    + time * C.TIME_FIT_WEIGHT + soft * C.SOFT_PREFS_WEIGHT + Math.max(0, legal);
  return Math.round(Math.min(100, Math.max(0, total)));
}

/** ציון לכל צד + ציון המעגל (החוליה החלשה + רכיב אורך). */
export function scoreCycle(cycle: MatchableListing[]): { score: number; scores: Record<string, number> } {
  const C = MATCHING_CONFIG;
  const scores: Record<string, number> = {};
  for (let i = 0; i < cycle.length; i++) {
    scores[cycle[i].id] = sideScore(cycle[i], cycle[(i + 1) % cycle.length]);
  }
  const weakest = Math.min(...Object.values(scores));
  const lengthTerm = cycle.length === 2 ? C.DIRECT_BONUS : -(cycle.length - 2) * C.CHAIN_LENGTH_PENALTY;
  return { score: Math.round(Math.min(100, Math.max(0, weakest + lengthTerm))), scores };
}

/** הסתברות סגירה משוערת (היוריסטיקה, שלב 1) — בסיס לתעדוף הליווי האנושי. */
export function estimateCloseProbability(cycle: MatchableListing[], scores: Record<string, number>): number {
  const C = MATCHING_CONFIG;
  const weakest = Math.min(...Object.values(scores)) / 100;
  const allVerified = cycle.every((l) => l.identity_verified);
  const p = weakest * C.CLOSE_PROB_SCORE_WEIGHT - (cycle.length - 2) * C.CLOSE_PROB_LENGTH_PENALTY
    + (allVerified ? C.CLOSE_PROB_VERIFIED_BONUS : 0);
  return Math.round(Math.min(C.CLOSE_PROB_MAX, Math.max(C.CLOSE_PROB_MIN, p)) * 1000) / 1000;
}

// ---------------------------------------------------------------------------
//  נקודת הכניסה
// ---------------------------------------------------------------------------

export function computeMatches(
  listings: MatchableListing[],
  maxLength: number = MATCHING_CONFIG.MAX_CHAIN_LENGTH,
): ComputedMatch[] {
  const pool = eligible(listings);
  const byId = new Map(pool.map((l) => [l.id, l]));
  return findCycles(pool, maxLength)
    .map((ids) => {
      const cycle = ids.map((id) => byId.get(id)!);
      const { score, scores } = scoreCycle(cycle);
      return {
        match_type: ids.length === 2 ? ('direct' as const) : ('chain' as const),
        chain_listing_ids: ids, score, scores,
        estimated_close_probability: estimateCloseProbability(cycle, scores),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** תנועות במעגל לתצוגה: מי עובר לאן וכמה כסף עובר. */
export function describeCycle(cycle: MatchableListing[]) {
  return cycle.map((from, i) => {
    const to = cycle[(i + 1) % cycle.length];
    return { from, to, cash: cashGap(from, to) };
  });
}
