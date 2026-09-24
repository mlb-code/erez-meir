'use client';

import { useActionState, useState } from 'react';
import { MoneyInput } from '@/components/money-input';
import {
  ButtonLink,
  Card,
  CheckboxChip,
  FormAlert,
  Input,
  Select,
  SubmitButton,
} from '@/components/ui';
import { saveWantedAndPublish, type ListingFormState } from '@/lib/actions/listings';
import {
  ASSET_TYPE_GROUPS,
  ASSET_TYPE_LABELS,
  CITIES,
  FEATURE_OPTIONS,
  ROOM_OPTIONS,
  SOFT_PREF_KEYS,
  SOFT_PREF_LABELS,
  SOFT_PREF_LEVELS,
  RESIDENTIAL_ASSET_TYPES,
} from '@/lib/constants';
import type { AssetType, Listing, Neighborhood } from '@/lib/types';

export function StepWanted({
  listing,
  neighborhoodsByCity,
}: {
  listing: Listing;
  neighborhoodsByCity: Record<string, Neighborhood[]>;
}) {
  const [state, formAction] = useActionState<ListingFormState, FormData>(saveWantedAndPublish, {});
  const isPublished = listing.status !== 'draft';

  const [assetTypes, setAssetTypes] = useState<AssetType[]>(
    listing.wanted_asset_types?.length ? listing.wanted_asset_types : ['apartment'],
  );
  const [cities, setCities] = useState<string[]>(listing.wanted_cities ?? []);

  const wantsResidential = assetTypes.some((type) => RESIDENTIAL_ASSET_TYPES.has(type));
  const selectedNeighborhoods = new Set(listing.wanted_neighborhood_ids ?? []);

  function toggle<T>(list: T[], value: T, checked: boolean): T[] {
    return checked ? [...list, value] : list.filter((item) => item !== value);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="listing_id" value={listing.id} />
      <FormAlert error={state.error} notice={state.notice} />

      {/* ---------- סוגי נכס ---------- */}
      <Card as="section" padding="lg" title="איזה נכס תרצה לקבל בתמורה">
        <p className="mb-3 text-caption leading-relaxed text-ink-600">
          אפשר לבחור כמה סוגים. בעל דירה שמוכן לקבל חנות או קרקע פותח לעצמו מעגלי החלפה שסגורים
          בפני אחרים.
        </p>
        <div className="flex flex-col gap-3">
          {ASSET_TYPE_GROUPS.map((entry) => (
            <fieldset key={entry.group}>
              <legend className="mb-2 text-caption font-semibold text-ink-700">{entry.label}</legend>
              <div className="flex flex-wrap gap-2">
                {entry.types.map((type) => (
                  <CheckboxChip
                    key={type}
                    name="wanted_asset_types"
                    value={type}
                    label={ASSET_TYPE_LABELS[type]}
                    checked={assetTypes.includes(type)}
                    onChange={(event) =>
                      setAssetTypes((current) => toggle(current, type, event.target.checked))
                    }
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </Card>

      {/* ---------- ערים ושכונות ---------- */}
      <Card as="section" padding="lg" title="באילו אזורים">
        <p className="mb-3 text-caption leading-relaxed text-ink-600">
          חובה לבחור לפחות עיר אחת. אחרי בחירת עיר אפשר לצמצם לשכונות מסוימות — בלי סימון
          שכונה, כל העיר נחשבת מתאימה.
        </p>

        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <CheckboxChip
              key={city}
              name="wanted_cities"
              value={city}
              label={city}
              checked={cities.includes(city)}
              onChange={(event) => setCities((current) => toggle(current, city, event.target.checked))}
            />
          ))}
        </div>

        {cities.length > 0 && (
          <div className="mt-5 flex flex-col gap-4">
            {cities.map((city) => (
              <fieldset key={city}>
                <legend className="mb-2 text-caption font-semibold text-ink-700">
                  שכונות ב{city}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {(neighborhoodsByCity[city] ?? []).map((neighborhood) => (
                    <CheckboxChip
                      key={neighborhood.id}
                      name="wanted_neighborhood_ids"
                      value={neighborhood.id}
                      label={neighborhood.name}
                      defaultChecked={selectedNeighborhoods.has(neighborhood.id)}
                      className="text-xs"
                    />
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </Card>

      {/* ---------- גודל, קומה ושווי ---------- */}
      <Card as="section" padding="lg" title="מה הנכס צריך לכלול">
        <div className="grid gap-4 sm:grid-cols-3">
          {wantsResidential && (
            <>
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
            </>
          )}

          <Input
            label="שטח מינימלי במ״ר"
            name="wanted_min_sqm"
            type="number"
            min={5}
            max={1_000_000}
            defaultValue={listing.wanted_min_sqm ?? ''}
            placeholder="לא משנה"
          />

          <Input
            label="קומה מינימלית"
            hint="למשל 1, כדי לא לקבל קומת קרקע."
            name="wanted_min_floor"
            type="number"
            min={-5}
            max={80}
            defaultValue={listing.wanted_min_floor ?? ''}
            placeholder="לא משנה"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MoneyInput
            label="שווי מינימלי מבוקש"
            name="wanted_value_min"
            defaultValue={listing.wanted_value_min}
            placeholder="לא משנה"
          />
          <MoneyInput
            label="שווי מקסימלי מבוקש"
            name="wanted_value_max"
            defaultValue={listing.wanted_value_max}
            placeholder="לא משנה"
          />
        </div>

        <fieldset className="mt-5">
          <legend className="mb-1 text-caption font-semibold text-ink-700">חובה שיהיה</legend>
          <p className="mb-2.5 text-caption text-ink-500">
            כל מה שתסמן כאן הופך לתנאי סף — נכס בלעדיו לא יוצע לך.
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
      </Card>

      {/* ---------- חלון זמן ---------- */}
      <Card as="section" padding="lg" title="מתי אתה יכול לעבור">
        <p className="mb-4 text-caption leading-relaxed text-ink-600">
          החלון הזה נבדק מול מועד המסירה של הצד השני. אפשר להשאיר ריק אם אתה גמיש לגמרי.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="מעבר אפשרי מתאריך"
            name="wanted_available_from"
            type="date"
            defaultValue={listing.wanted_available_from ?? ''}
          />
          <Input
            label="ועד תאריך"
            name="wanted_available_until"
            type="date"
            defaultValue={listing.wanted_available_until ?? ''}
          />
        </div>
      </Card>

      {/* ---------- העדפות רכות ---------- */}
      <Card as="section" padding="lg" title="מה חשוב לך, בלי להיות תנאי סף">
        <p className="mb-4 text-caption leading-relaxed text-ink-600">
          כאן מדרגים מ״לא משנה״ עד ״חשוב מאוד״. זה לא מסנן החוצה אף נכס — זה מעלה את ציון
          ההתאמה של נכסים שעונים על מה שחשוב לך, ומוריד את של האחרים.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOFT_PREF_KEYS.map((key) => (
            <Select
              key={key}
              label={SOFT_PREF_LABELS[key]}
              name={`soft_${key}`}
              defaultValue={listing.soft_prefs?.[key] ?? 0}
            >
              {SOFT_PREF_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </Select>
          ))}
        </div>
      </Card>

      {/* ---------- גמישות מזומן ---------- */}
      <Card as="section" tone="brand" padding="lg" title="גמישות מזומן">
        <p className="text-caption leading-relaxed text-brand-900">
          כמעט תמיד יש פער שווי בין שני נכסים. כאן קובעים מה הגבולות שלך — וזה מה שמאפשר למערכת
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
            label="כמה אני דורש לקבל לפחות, אם הנכס שלי שווה יותר"
            name="cash_receive_min"
            defaultValue={listing.cash_receive_min}
            min={0}
          />
        </div>
        <p className="text-xs text-brand-700">
          אפשר להשאיר 0 בשני השדות — זה אומר החלפה בשווי דומה.
        </p>
      </Card>

      {!isPublished && (
        <p className="rounded-field bg-ink-100 p-4 text-caption leading-relaxed text-ink-600">
          עם הפרסום המודעה עוברת לאימות בעלות: תתבקש להעלות נסח טאבו או אישור זכויות, ורק אחרי
          שמנהל התפעול יאשר אותו הנכס יעלה לאוויר וייכנס למנוע ההתאמות.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="flex-1">
          <SubmitButton pendingLabel="שומר…">
            {isPublished ? 'שמירת השינויים וחיפוש התאמות' : 'פרסום המודעה'}
          </SubmitButton>
        </div>
        <ButtonLink href={`/new?id=${listing.id}&step=3`} variant="secondary" size="lg">
          חזרה
        </ButtonLink>
      </div>
    </form>
  );
}
