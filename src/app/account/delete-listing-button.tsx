'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        className="text-danger-700 hover:bg-danger-50 hover:text-danger-800"
      >
        מחיקה
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-field border border-danger-200 bg-danger-50 px-3 py-2">
      <span className="text-caption font-semibold text-danger-900">למחוק את המודעה לצמיתות?</span>
      <form action={deleteListing}>
        <input type="hidden" name="listing_id" value={listingId} />
        <Button type="submit" variant="danger" size="sm">
          כן, למחוק
        </Button>
      </form>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        ביטול
      </Button>
    </div>
  );
}
