'use client';

import { useActionState } from 'react';
import { CheckboxChip, FormAlert, Input, Select, SubmitButton } from '@/components/ui';
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
        <Select label="עיר" name="city" required defaultValue={listing?.city ?? ''}>
          <option value="" disabled>
            בחירת עיר
          </option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>

        <Input label="שכונה" hint="לא חובה" name="neighborhood" defaultValue={listing?.neighborhood ?? ''} />

        <Input
          label="רחוב"
          hint="לא חובה. מספר הבית לא מוצג בלוח."
          name="street"
          defaultValue={listing?.street ?? ''}
        />

        <Select label="מספר חדרים" name="rooms" required defaultValue={listing?.rooms ?? ''}>
          <option value="" disabled>
            בחירה
          </option>
          {ROOM_OPTIONS.map((rooms) => (
            <option key={rooms} value={rooms}>
              {rooms}
            </option>
          ))}
        </Select>

        <Input
          label="שטח במ״ר"
          name="size_sqm"
          type="number"
          required
          min={15}
          max={1000}
          defaultValue={listing?.size_sqm ?? ''}
        />

        <Input
          label="שנת בנייה"
          hint="לא חובה"
          name="building_year"
          type="number"
          min={1900}
          max={new Date().getFullYear() + 5}
          defaultValue={listing?.building_year ?? ''}
        />

        <Input
          label="קומה"
          hint="לא חובה"
          name="floor"
          type="number"
          min={-2}
          max={80}
          defaultValue={listing?.floor ?? ''}
        />

        <Input
          label="סך הקומות בבניין"
          hint="לא חובה"
          name="total_floors"
          type="number"
          min={1}
          max={80}
          defaultValue={listing?.total_floors ?? ''}
        />

        <Select label="מצב הדירה" name="condition" defaultValue={listing?.condition ?? 'maintained'}>
          {(Object.keys(CONDITION_LABELS) as PropertyCondition[]).map((value) => (
            <option key={value} value={value}>
              {CONDITION_LABELS[value]}
            </option>
          ))}
        </Select>

        <Select
          label="התחדשות עירונית"
          hint="שדה חשוב בשוק הישראלי — משפיע על השווי העתידי."
          name="urban_renewal_status"
          defaultValue={listing?.urban_renewal_status ?? 'none'}
        >
          {(Object.keys(URBAN_RENEWAL_LABELS) as UrbanRenewalStatus[]).map((value) => (
            <option key={value} value={value}>
              {URBAN_RENEWAL_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>

      <fieldset>
        <legend className="mb-2 text-caption font-semibold text-ink-700">מה יש בדירה</legend>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => (
            <CheckboxChip
              key={amenity.name}
              name={amenity.name}
              label={amenity.label}
              defaultChecked={listing?.[amenity.name] ?? false}
            />
          ))}
        </div>
      </fieldset>

      <SubmitButton pendingLabel="שומר…">שמירה והמשך לתמונות</SubmitButton>
    </form>
  );
}
