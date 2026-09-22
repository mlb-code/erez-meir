/**
 * ===========================================================================
 *  הסורק היומי — לוגיקה טהורה (איפיון §9.2)
 * ===========================================================================
 *  לכל נכס שנחשף במלואו (אישור הפגשה) ב-24 החודשים האחרונים: האם נרשמה
 *  עסקה ציבורית על אותה חלקה אחרי מועד החשיפה? אם כן — התראה. אם גם הצד
 *  השני במעגל מכר בסמוך — חשד מוגבר ל"החלפה שעקפה את הפלטפורמה".
 *  אם כבר דווחה סגירה על הנכס — זה אימות דיווח, לא חשד.
 */

export interface ScannedListing {
  id: string;
  gush: number | null;
  helka: number | null;
  tat_helka: number | null;
  city: string;
  street: string | null;
  house_number: string | null;
}

export interface Exposure {
  listing_id: string;
  match_id: string;
  /** מועד החשיפה המלאה הראשונה של הנכס במעגל הזה. */
  first_exposed_at: Date;
  /** כל הנכסים באותו מעגל. */
  match_listing_ids: string[];
}

export interface PublicTransaction {
  id: number;
  gush: number | null;
  helka: number | null;
  tat_helka: number | null;
  city: string | null;
  street: string | null;
  house_number: string | null;
  sale_date: Date;
  price: number;
}

export interface ClosingReport { listing_id: string; match_id: string }

export interface ScanResult {
  listing_id: string;
  match_id: string;
  public_transaction_id: number;
  matched_by: 'gush_helka' | 'address';
  counterpart_also_sold: boolean;
  /** true = דווח מרצון — אימות, לא חשד. */
  reported_closing: boolean;
}

export const SCAN_CONFIG = {
  /** כמה חודשים אחורה מהחשיפה הנכס נשאר בניטור. */
  LOOKBACK_MONTHS: 24,
  /** חלון שבו מכירה של הצד השני נחשבת "בסמוך". */
  COUNTERPART_WINDOW_DAYS: 120,
  /** ריווח מינימלי בין חשיפה למכירה כדי להיחשב תוצאה של ההיכרות (מסנן רעש של עסקאות ישנות). */
  MIN_DAYS_AFTER_EXPOSURE: 0,
} as const;

const DAY = 86_400_000;
const norm = (s: string | null | undefined) => (s ?? '').replace(/["'״׳]/g, '').replace(/\s+/g, ' ').trim();

/** האם עסקה ציבורית מתייחסת לנכס — לפי חלקה, ואם אין — לפי כתובת מלאה. */
export function transactionMatchesListing(tx: PublicTransaction, listing: ScannedListing): ScanResult['matched_by'] | null {
  const listingHasParcel = listing.gush != null && listing.helka != null;
  const txHasParcel = tx.gush != null && tx.helka != null;

  if (listingHasParcel && txHasParcel) {
    // לשניים יש חלקה — היא המילה האחרונה. חלקה שונה = נכס אחר, בלי נפילה לכתובת.
    if (tx.gush !== listing.gush || tx.helka !== listing.helka) return null;
    // תת-חלקה: אם לשני הצדדים יש — חייבת להתאים; אם לאחד חסר — מספיק גוש+חלקה
    if (listing.tat_helka != null && tx.tat_helka != null && tx.tat_helka !== listing.tat_helka) return null;
    return 'gush_helka';
  }
  // חלקה חסרה באחד הצדדים — כתובת מלאה
  if (listing.street && listing.house_number && tx.street && tx.house_number
      && norm(tx.city) === norm(listing.city) && norm(tx.street) === norm(listing.street)
      && norm(tx.house_number) === norm(listing.house_number)) {
    return 'address';
  }
  return null;
}

export function scanForBypass(
  listings: ScannedListing[],
  exposures: Exposure[],
  transactions: PublicTransaction[],
  closings: ClosingReport[],
  now: Date = new Date(),
): ScanResult[] {
  const byId = new Map(listings.map((l) => [l.id, l]));
  const lookback = now.getTime() - SCAN_CONFIG.LOOKBACK_MONTHS * 30.4375 * DAY;
  const reported = new Set(closings.map((c) => `${c.match_id}:${c.listing_id}`));

  // עסקה אחרי החשיפה, לכל נכס — לשימוש חוזר בבדיקת "הצד השני גם מכר"
  const salesAfter = (listingId: string, after: Date): PublicTransaction[] => {
    const l = byId.get(listingId);
    if (!l) return [];
    return transactions.filter((tx) =>
      transactionMatchesListing(tx, l) !== null
      && tx.sale_date.getTime() >= after.getTime() + SCAN_CONFIG.MIN_DAYS_AFTER_EXPOSURE * DAY);
  };

  const results: ScanResult[] = [];
  const seen = new Set<string>();

  for (const exposure of exposures) {
    if (exposure.first_exposed_at.getTime() < lookback) continue;
    const listing = byId.get(exposure.listing_id);
    if (!listing) continue;

    for (const tx of salesAfter(exposure.listing_id, exposure.first_exposed_at)) {
      const key = `${exposure.listing_id}:${tx.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const counterpartSold = exposure.match_listing_ids
        .filter((id) => id !== exposure.listing_id)
        .some((otherId) => salesAfter(otherId, exposure.first_exposed_at)
          .some((otherTx) => Math.abs(otherTx.sale_date.getTime() - tx.sale_date.getTime()) <= SCAN_CONFIG.COUNTERPART_WINDOW_DAYS * DAY));

      results.push({
        listing_id: exposure.listing_id,
        match_id: exposure.match_id,
        public_transaction_id: tx.id,
        matched_by: transactionMatchesListing(tx, listing)!,
        counterpart_also_sold: counterpartSold,
        reported_closing: reported.has(`${exposure.match_id}:${exposure.listing_id}`),
      });
    }
  }
  return results;
}
