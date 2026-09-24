'use client';

import { useActionState } from 'react';
import { MoneyInput } from '@/components/money-input';
import { ButtonLink, CheckboxChip, FormAlert, Input, Select, SubmitButton } from '@/components/ui';
import { saveWantedAndPublish, type ListingFormState } from '@/lib/actions/listings';
import { CITIES, FEATURE_OPTIONS, ROOM_OPTIONS } from '@/lib/constants';
import type { Listing } from '@/lib/types';

export function StepWanted({ listing }: { listing: Listing }) {
  const [state, formAction] = useActionState<ListingFormState, FormData>(saveWantedAndPublish, {});
  const isPublished = listing.status !== 'draft';

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="listing_id" value={listing.id} />
      <FormAlert error={state.error} notice={state.notice} />

      <fieldset>
        <legend className="mb-1 text-caption font-semibold text-ink-700">
          באילו אזורים תרצה לקבל דירה?
        </legend>
        <p className="mb-2.5 text-caption text-ink-500">אפשר לבחור כמה שרוצים. חובה לפחות אחד.</p>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <CheckboxChip
              key={city}
              name="wanted_cities"
              value={city}
              label={city}
              defaultChecked={listing.wanted_cities.includes(city)}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="מינימום חדרים"
          name="wanted_min_rooms"
          defaultValue={listing.wanted_min_rooms ?? ''}
        >
          <option value="">לא משנה</option>
          {ROOM_OPTIONS.map((rooms) => (
            <option key={rooms} value={rooms}>
              {rooms}
            </option>
          ))}
        </Select>

        <Select
          label="מקסימום חדרים"
          name="wanted_max_rooms"
          defaultValue={listing.wanted_max_rooms ?? ''}
        >
          <option value="">לא משנה</option>
          {ROOM_OPTIONS.map((rooms) => (
            <option key={rooms} value={rooms}>
              {rooms}
            </option>
          ))}
        </Select>

        <Input
          label="שטח מינימלי במ״ר"
          name="wanted_min_sqm"
          type="number"
          min={15}
          max={1000}
          defaultValue={listing.wanted_min_sqm ?? ''}
          placeholder="לא משנה"
        />
      </div>

      <fieldset>
        <legend className="mb-1 text-caption font-semibold text-ink-700">מה חייב להיות בדירה</legend>
        <p className="mb-2.5 text-caption text-ink-500">
          כל מה שתסמן כאן הופך לתנאי סף — דירה בלעדיו לא תוצע לך.
        </p>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((feature) => (
            <CheckboxChip
              key={feature.value}
              name="must_haves"
              value={feature.value}
              label={feature.label}
              defaultChecked={listing.must_haves.includes(feature.value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-card border border-brand-200 bg-brand-50 p-4 sm:p-5">
        <legend className="px-1 text-caption font-extrabold text-brand-900">גמישות מזומן</legend>
        <p className="text-caption leading-relaxed text-brand-900">
          כמעט תמיד יש פער שווי בין שתי דירות. כאן קובעים מה הגבולות שלך — וזה מה שמאפשר למערכת
          לבנות מעגלי החלפה שעובדים כלכלית לכל הצדדים.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MoneyInput
            label="כמה אני מוכן להוסיף מכיסי, לכל היותר"
            name="cash_add_max"
            defaultValue={listing.cash_add_max}
            min={0}
          />
          <MoneyInput
            label="כמה אני דורש לקבל לפחות, אם דירתי שווה יותר"
            name="cash_receive_min"
            defaultValue={listing.cash_receive_min}
            min={0}
          />
        </div>
        <p className="text-xs text-brand-700">
          אפשר להשאיר 0 בשני השדות — זה אומר החלפה בשווי דומה.
        </p>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1">
          <SubmitButton pendingLabel="מחפש התאמות…">
            {isPublished ? 'שמירת השינויים וחיפוש התאמות' : 'פרסום המודעה וחיפוש התאמות'}
          </SubmitButton>
        </div>
        <ButtonLink href={`/new?id=${listing.id}&step=3`} variant="secondary" size="lg">
          חזרה
        </ButtonLink>
      </div>
    </form>
  );
}
