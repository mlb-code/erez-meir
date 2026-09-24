'use client';

import { useActionState } from 'react';
import { MoneyInput } from '@/components/money-input';
import { Alert, ButtonLink, FormAlert, SubmitButton, Textarea } from '@/components/ui';
import { saveValue, type ListingFormState } from '@/lib/actions/listings';
import type { Listing } from '@/lib/types';

export function StepValue({ listing }: { listing: Listing }) {
  const [state, formAction] = useActionState<ListingFormState, FormData>(saveValue, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="listing_id" value={listing.id} />
      <FormAlert error={state.error} notice={state.notice} />

      <Alert tone="info" title="השווי המוצהר הוא מספר עובד, לא מספר לראווה">
        הפער בין השווי שהצהרת לבין השווי של הנכס שתקבל בתמורה הוא בדיוק תשלום האיזון שיעבור
        בין הצדדים. שווי מנופח מייצר פער גדול שאף אחד לא ישלים, ומוציא אותך ממעגלי החלפה
        שהיו מתאימים לך.
      </Alert>

      <MoneyInput
        label="השווי המוצהר של הנכס"
        hint="כאן מצהירים כמה הנכס שווה לדעתך. זה הבסיס לחישוב פער המזומן מול הנכס שתקבל בתמורה."
        name="asking_value"
        required
        min={100_000}
        defaultValue={listing.asking_value}
        placeholder="4500000"
      />

      <Textarea
        label="תיאור הנכס"
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
