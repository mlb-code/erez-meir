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
        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
      >
        מחיקה
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
      <span className="text-sm font-semibold text-red-900">למחוק את המודעה לצמיתות?</span>
      <form action={deleteListing}>
        <input type="hidden" name="listing_id" value={listingId} />
        <button
          type="submit"
          className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-800"
        >
          כן, למחוק
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ביטול
      </button>
    </div>
  );
}
