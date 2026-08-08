'use client';

import { useActionState } from 'react';
import { Field, FormAlert, inputClass, SubmitButton } from '@/components/form';
import { saveDetails, type ListingFormState } from '@/lib/actions/listings';
import { CITIES, CONDITION_LABELS, ROOM_OPTIONS, URBAN_RENEWAL_LABELS } from '@/lib/constants';
import type { Listing, PropertyCondition, UrbanRenewalStatus } from '@/lib/types';

const AMENITIES = [
  { name: 'has_elevator', label: 'מעלית' },
  { name: 'has_parking', label: 'חניה' },
  { name: 'has_balcony', label: 'מרפסת' },
  { name: 'has_safe_room', label: 'ממ״ד' },
] as const;

export function StepDetails({ listing }: { listing: Listing | null }) {
  const [state, formAction] = useActionState<ListingFormState, FormData>(saveDetails, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {listing && <input type="hidden" name="listing_id" value={listing.id} />}
      <FormAlert error={state.error} notice={state.notice} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="עיר">
          <select name="city" required defaultValue={listing?.city ?? ''} className={inputClass}>
            <option value="" disabled>
              בחירת עיר
            </option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </Field>

        <Field label="שכונה" hint="לא חובה">
          <input name="neighborhood" defaultValue={listing?.neighborhood ?? ''} className={inputClass} />
        </Field>

        <Field label="רחוב" hint="לא חובה. מספר הבית לא מוצג בלוח.">
          <input name="street" defaultValue={listing?.street ?? ''} className={inputClass} />
        </Field>

        <Field label="מספר חדרים">
          <select name="rooms" required defaultValue={listing?.rooms ?? ''} className={inputClass}>
            <option value="" disabled>
              בחירה
            </option>
            {ROOM_OPTIONS.map((rooms) => (
              <option key={rooms} value={rooms}>
                {rooms}
              </option>
            ))}
          </select>
        </Field>

        <Field label="שטח במ״ר">
          <input
            name="size_sqm"
            type="number"
            required
            min={15}
            max={1000}
            defaultValue={listing?.size_sqm ?? ''}
            className={inputClass}
          />
        </Field>

        <Field label="שנת בנייה" hint="לא חובה">
          <input
            name="building_year"
            type="number"
            min={1900}
            max={new Date().getFullYear() + 5}
            defaultValue={listing?.building_year ?? ''}
            className={inputClass}
          />
        </Field>

        <Field label="קומה" hint="לא חובה">
          <input
            name="floor"
            type="number"
            min={-2}
            max={80}
            defaultValue={listing?.floor ?? ''}
            className={inputClass}
          />
        </Field>

        <Field label="סך הקומות בבניין" hint="לא חובה">
          <input
            name="total_floors"
            type="number"
            min={1}
            max={80}
            defaultValue={listing?.total_floors ?? ''}
            className={inputClass}
          />
        </Field>

        <Field label="מצב הדירה">
          <select
            name="condition"
            defaultValue={listing?.condition ?? 'maintained'}
            className={inputClass}
          >
            {(Object.keys(CONDITION_LABELS) as PropertyCondition[]).map((value) => (
              <option key={value} value={value}>
                {CONDITION_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="התחדשות עירונית" hint="שדה חשוב בשוק הישראלי — משפיע על השווי העתידי.">
          <select
            name="urban_renewal_status"
            defaultValue={listing?.urban_renewal_status ?? 'none'}
            className={inputClass}
          >
            {(Object.keys(URBAN_RENEWAL_LABELS) as UrbanRenewalStatus[]).map((value) => (
              <option key={value} value={value}>
                {URBAN_RENEWAL_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-700">מה יש בדירה</legend>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => (
            <label
              key={amenity.name}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-800"
            >
              <input
                type="checkbox"
                name={amenity.name}
                defaultChecked={listing?.[amenity.name] ?? false}
                className="h-4 w-4 accent-brand-600"
              />
              {amenity.label}
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton pendingLabel="שומר…">שמירה והמשך לתמונות</SubmitButton>
    </form>
  );
}
