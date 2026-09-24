'use client';

import { useState } from 'react';
import { deleteListing } from '@/lib/actions/listings';

/**
 * מחיקה בשני שלבים, בתוך העמוד עצמו.
 * מכוון: לא window.confirm — חלונית מערכת מתנהגת שונה בין דפדפנים
 * ובמובייל, ובתוך טופס עם Server Action היא עלולה לבטל את השליחה.
 */
export function DeleteListingButton({ listingId }: { listingId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-danger-200 px-3 py-2 text-sm font-semibold text-danger-700 transition-colors hover:bg-danger-50"
      >
        מחיקה
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2">
      <span className="text-sm font-semibold text-danger-900">למחוק את המודעה לצמיתות?</span>
      <form action={deleteListing}>
        <input type="hidden" name="listing_id" value={listingId} />
        <button
          type="submit"
          className="rounded-lg bg-danger-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-danger-800"
        >
          כן, למחוק
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"
      >
        ביטול
      </button>
    </div>
  );
}
