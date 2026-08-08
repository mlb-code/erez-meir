'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Field, FormAlert, inputClass, SubmitButton } from '@/components/form';
import { MoneyInput } from '@/components/money-input';
import { saveWantedAndPublish, type ListingFormState } from '@/lib/actions/listings';
import { CITIES, FEATURE_OPTIONS, ROOM_OPTIONS } from '@/lib/constants';
import type { Listing } from '@/lib/types';

export function StepWanted({ listing }: { listing: Listing }) {
  const [state, formAction] = useActionState<ListingFormState, FormData>(
    saveWantedAndPublish,
    {},
  );
  const isPublished = listing.status !== 'draft';

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="listing_id" value={listing.id} />
      <FormAlert error={state.error} notice={state.notice} />

      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-slate-700">
          באילו אזורים תרצה לקבל דירה?
        </legend>
        <p className="mb-2.5 text-xs text-slate-500">אפשר לבחור כמה שרוצים. חובה לפחות אחד.</p>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <label
              key={city}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-800"
            >
              <input
                type="checkbox"
                name="wanted_cities"
                value={city}
                defaultChecked={listing.wanted_cities.includes(city)}
                className="h-4 w-4 accent-brand-600"
              />
              {city}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="מינימום חדרים">
          <select
            name="wanted_min_rooms"
            defaultValue={listing.wanted_min_rooms ?? ''}
            className={inputClass}
          >
            <option value="">לא משנה</option>
            {ROOM_OPTIONS.map((rooms) => (
              <option key={rooms} value={rooms}>
                {rooms}
              </option>
            ))}
          </select>
        </Field>

        <Field label="מקסימום חדרים">
          <select
            name="wanted_max_rooms"
            defaultValue={listing.wanted_max_rooms ?? ''}
            className={inputClass}
          >
            <option value="">לא משנה</option>
            {ROOM_OPTIONS.map((rooms) => (
              <option key={rooms} value={rooms}>
                {rooms}
              </option>
            ))}
          </select>
        </Field>

        <Field label="שטח מינימלי במ״ר">
          <input
            name="wanted_min_sqm"
            type="number"
            min={15}
            max={1000}
            defaultValue={listing.wanted_min_sqm ?? ''}
            placeholder="לא משנה"
            className={inputClass}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-slate-700">מה חייב להיות בדירה</legend>
        <p className="mb-2.5 text-xs text-slate-500">
          כל מה שתסמן כאן הופך לתנאי סף — דירה בלעדיו לא תוצע לך.
        </p>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((feature) => (
            <label
              key={feature.value}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-800"
            >
              <input
                type="checkbox"
                name="must_haves"
                value={feature.value}
                defaultChecked={listing.must_haves.includes(feature.value)}
                className="h-4 w-4 accent-brand-600"
              />
              {feature.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-4">
        <legend className="px-1 text-sm font-extrabold text-brand-900">גמישות מזומן</legend>
        <p className="text-sm leading-relaxed text-brand-900">
          כמעט תמיד יש פער שווי בין שתי דירות. כאן קובעים מה הגבולות שלך — וזה מה שמאפשר למערכת
          לבנות מעגלי החלפה שעובדים כלכלית לכל הצדדים.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="כמה אני מוכן להוסיף מכיסי, לכל היותר">
            <MoneyInput name="cash_add_max" defaultValue={listing.cash_add_max} min={0} />
          </Field>
          <Field label="כמה אני דורש לקבל לפחות, אם דירתי שווה יותר">
            <MoneyInput name="cash_receive_min" defaultValue={listing.cash_receive_min} min={0} />
          </Field>
        </div>
        <p className="text-xs text-brand-700">אפשר להשאיר 0 בשני השדות — זה אומר החלפה בשווי דומה.</p>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1">
          <SubmitButton pendingLabel="מחפש התאמות…">
            {isPublished ? 'שמירת השינויים וחיפוש התאמות' : 'פרסום המודעה וחיפוש התאמות'}
          </SubmitButton>
        </div>
        <Link
          href={`/new?id=${listing.id}&step=3`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-base font-semibold text-slate-700 hover:bg-slate-50"
        >
          חזרה
        </Link>
      </div>
    </form>
  );
}
