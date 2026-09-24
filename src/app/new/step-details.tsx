'use client';

import { useActionState, useState } from 'react';
import { MoneyInput } from '@/components/money-input';
import { Card, CheckboxChip, FormAlert, Input, Select, SubmitButton } from '@/components/ui';
import { saveDetails, type ListingFormState } from '@/lib/actions/listings';
import {
  ASSET_TYPE_GROUPS,
  ASSET_TYPE_LABELS,
  AVAILABILITY_FLEX_OPTIONS,
  CITIES,
  COMMERCIAL_USES,
  CONDITION_LABELS,
  LAND_ZONINGS,
  RIGHT_TYPE_LABELS,
  ROOM_OPTIONS,
  URBAN_RENEWAL_LABELS,
  assetGroup,
} from '@/lib/constants';
import type {
  AssetType,
  Listing,
  Neighborhood,
  PropertyCondition,
  RightType,
  UrbanRenewalStatus,
} from '@/lib/types';

const PARKING_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 8, 10] as const;

function parkingLabel(count: number): string {
  if (count === 0) return 'ללא חניה';
  if (count === 1) return 'חניה אחת';
  return `${count} חניות`;
}

/** מודעה ישנה נשמרה עם has_parking בלבד — מתרגמים אותה למספר חניות. */
function initialParking(listing: Listing | null): number {
  if (!listing) return 0;
  return listing.parking_count > 0 ? listing.parking_count : listing.has_parking ? 1 : 0;
}

export function StepDetails({
  listing,
  neighborhoodsByCity,
}: {
  listing: Listing | null;
  neighborhoodsByCity: Record<string, Neighborhood[]>;
}) {
  const [state, formAction] = useActionState<ListingFormState, FormData>(saveDetails, {});

  const [assetType, setAssetType] = useState<AssetType>(listing?.asset_type ?? 'apartment');
  const [city, setCity] = useState(listing?.city ?? '');
  const [neighborhoodId, setNeighborhoodId] = useState(listing?.neighborhood_id ?? '');
  const [rightType, setRightType] = useState<RightType>(listing?.right_type ?? 'ownership');
  const [hasMortgage, setHasMortgage] = useState(listing?.has_mortgage ?? false);
  const [hasTenant, setHasTenant] = useState(listing?.has_tenant ?? false);

  const group = assetGroup(assetType);
  const neighborhoods = neighborhoodsByCity[city] ?? [];
  const isResidential = group === 'residential';

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {listing && <input type="hidden" name="listing_id" value={listing.id} />}
      <FormAlert error={state.error} notice={state.notice} />

      {/* ---------- סוג הנכס — הבחירה שקובעת את שאר הטופס ---------- */}
      <Card as="section" padding="lg" title="סוג הנכס">
        <Select
          label="מה הנכס שאתה מציע להחלפה"
          hint="הבחירה הזו קובעת אילו פרטים נשאל בהמשך."
          name="asset_type"
          required
          value={assetType}
          onChange={(event) => setAssetType(event.target.value as AssetType)}
        >
          {ASSET_TYPE_GROUPS.map((entry) => (
            <optgroup key={entry.group} label={entry.label}>
              {entry.types.map((type) => (
                <option key={type} value={type}>
                  {ASSET_TYPE_LABELS[type]}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Card>

      {/* ---------- מיקום ---------- */}
      <Card as="section" padding="lg" title="מיקום">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="עיר"
            name="city"
            required
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setNeighborhoodId('');
            }}
          >
            <option value="" disabled>
              בחירת עיר
            </option>
            {CITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>

          <Select
            label="שכונה"
            hint={city ? 'מתוך רשימת השכונות של העיר.' : 'צריך לבחור עיר קודם.'}
            name="neighborhood_id"
            disabled={!city}
            value={neighborhoodId}
            onChange={(event) => setNeighborhoodId(event.target.value)}
          >
            <option value="">ללא שכונה מוגדרת</option>
            {neighborhoods.map((neighborhood) => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.name}
              </option>
            ))}
          </Select>

          <Input label="רחוב" hint="לא חובה" name="street" defaultValue={listing?.street ?? ''} />

          <Input
            label="מספר בית"
            hint="פרטי, לא יופיע בלוח. נחשף רק אחרי שכל הצדדים חותמים על אישור הפגשה."
            name="house_number"
            defaultValue={listing?.house_number ?? ''}
          />
        </div>
      </Card>

      {/* ---------- פרטי הנכס — משתנה לפי הסוג ---------- */}
      <Card as="section" padding="lg" title="פרטי הנכס">
        <div className="grid gap-4 sm:grid-cols-2">
          {isResidential && (
            <Select
              label="מספר חדרים"
              name="rooms"
              required
              defaultValue={listing?.rooms ?? ''}
              key={`rooms-${assetType}`}
            >
              <option value="" disabled>
                בחירה
              </option>
              {ROOM_OPTIONS.map((rooms) => (
                <option key={rooms} value={rooms}>
                  {rooms}
                </option>
              ))}
            </Select>
          )}

          <Input
            label={group === 'land' ? 'שטח המגרש במ״ר' : 'שטח במ״ר'}
            name="size_sqm"
            type="number"
            required
            min={group === 'land' ? 50 : group === 'unit' ? 2 : 5}
            max={group === 'land' ? 1_000_000 : group === 'commercial' ? 50_000 : 2000}
            defaultValue={listing?.size_sqm ?? ''}
          />

          {group === 'commercial' && (
            <Select
              label="ייעוד הנכס"
              name="commercial_use"
              defaultValue={listing?.commercial_use ?? ''}
            >
              <option value="">לא הוגדר</option>
              {COMMERCIAL_USES.map((use) => (
                <option key={use} value={use}>
                  {use}
                </option>
              ))}
            </Select>
          )}

          {group !== 'land' && (
            <Input
              label="קומה"
              hint="לא חובה"
              name="floor"
              type="number"
              min={-5}
              max={80}
              defaultValue={listing?.floor ?? ''}
            />
          )}

          {isResidential && (
            <>
              <Input
                label="סך הקומות בבניין"
                hint="לא חובה"
                name="total_floors"
                type="number"
                min={1}
                max={80}
                defaultValue={listing?.total_floors ?? ''}
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
            </>
          )}

          {(isResidential || group === 'commercial') && (
            <Select
              label="חניות"
              name="parking_count"
              defaultValue={initialParking(listing)}
              key={`parking-${assetType}`}
            >
              {PARKING_OPTIONS.map((count) => (
                <option key={count} value={count}>
                  {parkingLabel(count)}
                </option>
              ))}
            </Select>
          )}

          {group !== 'land' && (
            <Select
              label="מצב הנכס"
              name="condition"
              defaultValue={listing?.condition ?? 'maintained'}
            >
              {(Object.keys(CONDITION_LABELS) as PropertyCondition[]).map((value) => (
                <option key={value} value={value}>
                  {CONDITION_LABELS[value]}
                </option>
              ))}
            </Select>
          )}

          {isResidential && (
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
          )}

          {group === 'commercial' && (
            <Input
              label="תשואה שנתית באחוזים"
              hint="לא חובה. רלוונטי כשהנכס מושכר."
              name="annual_yield"
              type="number"
              step={0.1}
              min={0}
              max={99}
              inputClassName="text-left"
              defaultValue={listing?.annual_yield ?? ''}
            />
          )}

          {group === 'land' && (
            <>
              <Select
                label="ייעוד תכנוני"
                name="land_zoning"
                defaultValue={listing?.land_zoning ?? ''}
              >
                <option value="">לא הוגדר</option>
                {LAND_ZONINGS.map((zoning) => (
                  <option key={zoning} value={zoning}>
                    {zoning}
                  </option>
                ))}
              </Select>

              <Input
                label="זכויות בנייה במ״ר"
                hint="לא חובה"
                name="building_rights_sqm"
                type="number"
                min={0}
                max={1_000_000}
                defaultValue={listing?.building_rights_sqm ?? ''}
              />
            </>
          )}
        </div>

        {isResidential && (
          <fieldset className="mt-5">
            <legend className="mb-2 text-caption font-semibold text-ink-700">מה יש בנכס</legend>
            <div className="flex flex-wrap gap-2">
              <CheckboxChip
                name="has_elevator"
                label="מעלית"
                defaultChecked={listing?.has_elevator ?? false}
              />
              <CheckboxChip
                name="has_balcony"
                label="מרפסת"
                defaultChecked={listing?.has_balcony ?? false}
              />
              <CheckboxChip
                name="has_safe_room"
                label="ממ״ד"
                defaultChecked={listing?.has_safe_room ?? false}
              />
              <CheckboxChip
                name="has_storage"
                label="מחסן"
                defaultChecked={listing?.has_storage ?? false}
              />
            </div>
          </fieldset>
        )}

        {group === 'land' && (
          <fieldset className="mt-5">
            <legend className="mb-2 text-caption font-semibold text-ink-700">מצב המגרש</legend>
            <div className="flex flex-wrap gap-2">
              <CheckboxChip
                name="land_is_fenced"
                label="מגודר"
                defaultChecked={listing?.land_is_fenced ?? false}
              />
              <CheckboxChip
                name="land_is_vacant"
                label="פנוי מבנייה"
                defaultChecked={listing?.land_is_vacant ?? false}
              />
            </div>
          </fieldset>
        )}
      </Card>

      {/* ---------- זיהוי הזכות ---------- */}
      <Card as="section" padding="lg" title="זיהוי הזכות בנכס">
        <p className="mb-4 text-caption leading-relaxed text-ink-600">
          הפרטים האלה הם הבסיס לאימות הבעלות מול נסח הטאבו. גוש, חלקה ותת־חלקה אינם מוצגים בלוח
          ונחשפים רק אחרי חתימה על אישור הפגשה.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="גוש"
            name="gush"
            type="number"
            min={1}
            max={99_999}
            inputClassName="text-left"
            defaultValue={listing?.gush ?? ''}
          />
          <Input
            label="חלקה"
            name="helka"
            type="number"
            min={1}
            max={99_999}
            inputClassName="text-left"
            defaultValue={listing?.helka ?? ''}
          />
          <Input
            label="תת־חלקה"
            hint="לא חובה"
            name="tat_helka"
            type="number"
            min={1}
            max={9_999}
            inputClassName="text-left"
            defaultValue={listing?.tat_helka ?? ''}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select
            label="סוג הזכות"
            name="right_type"
            required
            value={rightType}
            onChange={(event) => setRightType(event.target.value as RightType)}
          >
            {(Object.keys(RIGHT_TYPE_LABELS) as RightType[]).map((value) => (
              <option key={value} value={value}>
                {RIGHT_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>

          {rightType === 'lease_rmi' && (
            <Input
              label="מספר חוזה החכירה"
              hint="כפי שמופיע באישור הזכויות מרשות מקרקעי ישראל."
              name="lease_contract_no"
              defaultValue={listing?.lease_contract_no ?? ''}
            />
          )}
        </div>
      </Card>

      {/* ---------- מצב משפטי ---------- */}
      <Card as="section" padding="lg" title="מצב משפטי">
        <p className="mb-4 text-caption leading-relaxed text-ink-600">
          מה שתצהיר כאן מוצלב מול נסח הטאבו בשלב אימות הבעלות. הצהרה מלאה מונעת הפתעות בהמשך
          ומעלה את ציון ההתאמה.
        </p>

        <div className="flex flex-wrap gap-2">
          <CheckboxChip
            name="has_mortgage"
            label="משכנתא רשומה"
            checked={hasMortgage}
            onChange={(event) => setHasMortgage(event.target.checked)}
          />
          <CheckboxChip
            name="has_caveats"
            label="הערות אזהרה"
            defaultChecked={listing?.has_caveats ?? false}
          />
          <CheckboxChip
            name="has_liens"
            label="עיקולים"
            defaultChecked={listing?.has_liens ?? false}
          />
          <CheckboxChip
            name="has_tenant"
            label="יש שוכר בנכס"
            checked={hasTenant}
            onChange={(event) => setHasTenant(event.target.checked)}
          />
        </div>

        {(hasMortgage || hasTenant) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {hasMortgage && (
              <MoneyInput
                label="יתרת המשכנתא המשוערת"
                hint="אומדן מספיק. המספר לא מוצג לצד השני."
                name="mortgage_balance"
                defaultValue={listing?.mortgage_balance ?? null}
              />
            )}
            {hasTenant && (
              <Input
                label="תום חוזה השכירות"
                name="tenant_lease_ends"
                type="date"
                defaultValue={listing?.tenant_lease_ends ?? ''}
              />
            )}
          </div>
        )}
      </Card>

      {/* ---------- חלון הפינוי ---------- */}
      <Card as="section" padding="lg" title="מתי אפשר למסור את הנכס">
        <p className="mb-4 text-caption leading-relaxed text-ink-600">
          חלון המסירה שלך נבדק מול חלון המעבר של הצד השני. ככל שהוא רחב יותר, כך נפתחות יותר
          אפשרויות להחלפה.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="מסירה אפשרית מתאריך"
            name="available_from"
            type="date"
            defaultValue={listing?.available_from ?? ''}
          />
          <Input
            label="ועד תאריך"
            name="available_until"
            type="date"
            defaultValue={listing?.available_until ?? ''}
          />
          <Select
            label="גמישות במועד"
            name="availability_flex_months"
            defaultValue={listing?.availability_flex_months ?? 0}
          >
            {AVAILABILITY_FLEX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <SubmitButton pendingLabel="שומר…">שמירה והמשך לתמונות</SubmitButton>
    </form>
  );
}
