'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Field, FormAlert, inputClass, SubmitButton } from '@/components/form';
import { MoneyInput } from '@/components/money-input';
import { saveValue, type ListingFormState } from '@/lib/actions/listings';
import type { Listing } from '@/lib/types';

export function StepValue({ listing }: { listing: Listing }) {
  const [state, formAction] = useActionState<ListingFormState, FormData>(saveValue, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="listing_id" value={listing.id} />
      <FormAlert error={state.error} notice={state.notice} />

      <Field
        label="השווי המבוקש עבור הדירה"
        hint="השווי הזה הוא הבסיס לחישוב פער המזומן מול הדירה שתקבל בתמורה."
      >
        <MoneyInput
          name="asking_value"
          required
          min={100_000}
          defaultValue={listing.asking_value}
          placeholder="4500000"
        />
      </Field>

      <Field label="תיאור הדירה" hint="לא חובה, אבל מודעה עם תיאור מקבלת הרבה יותר פניות.">
        <textarea
          name="description"
          rows={6}
          maxLength={2000}
          defaultValue={listing.description ?? ''}
          className={`${inputClass} resize-y leading-relaxed`}
          placeholder="למשל: שלושה חדרים משופצים, מרפסת שמש פונה לדרום, בניין שקט עם ועד פעיל…"
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1">
          <SubmitButton pendingLabel="שומר…">המשך — מה אני מחפש</SubmitButton>
        </div>
        <Link
          href={`/new?id=${listing.id}&step=2`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-base font-semibold text-slate-700 hover:bg-slate-50"
        >
          חזרה
        </Link>
      </div>
    </form>
  );
}
