'use client';

import { useActionState } from 'react';
import { MoneyInput } from '@/components/money-input';
import { ButtonLink, FormAlert, SubmitButton, Textarea } from '@/components/ui';
import { saveValue, type ListingFormState } from '@/lib/actions/listings';
import type { Listing } from '@/lib/types';

export function StepValue({ listing }: { listing: Listing }) {
  const [state, formAction] = useActionState<ListingFormState, FormData>(saveValue, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="listing_id" value={listing.id} />
      <FormAlert error={state.error} notice={state.notice} />

      <MoneyInput
        label="השווי המבוקש עבור הדירה"
        hint="השווי הזה הוא הבסיס לחישוב פער המזומן מול הדירה שתקבל בתמורה."
        name="asking_value"
        required
        min={100_000}
        defaultValue={listing.asking_value}
        placeholder="4500000"
      />

      <Textarea
        label="תיאור הדירה"
        hint="לא חובה, אבל מודעה עם תיאור מקבלת הרבה יותר פניות."
        name="description"
        rows={6}
        maxLength={2000}
        defaultValue={listing.description ?? ''}
        placeholder="למשל: שלושה חדרים משופצים, מרפסת שמש פונה לדרום, בניין שקט עם ועד פעיל…"
      />

      <div className="flex flex-wrap gap-3">
        <div className="flex-1">
          <SubmitButton pendingLabel="שומר…">המשך — מה אני מחפש</SubmitButton>
        </div>
        <ButtonLink href={`/new?id=${listing.id}&step=2`} variant="secondary" size="lg">
          חזרה
        </ButtonLink>
      </div>
    </form>
  );
}
