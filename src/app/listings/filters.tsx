import Link from 'next/link';
import { Button, Card, Select } from '@/components/ui';
import { CITIES, ROOM_OPTIONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';

const VALUE_STEPS = [
  1_500_000, 2_000_000, 2_500_000, 3_000_000, 3_500_000, 4_000_000, 4_500_000, 5_000_000,
  6_000_000, 7_000_000, 8_000_000,
];

export interface FilterValues {
  city?: string;
  minRooms?: string;
  maxRooms?: string;
  minValue?: string;
  maxValue?: string;
  wantedCity?: string;
}

/** טופס סינון פשוט מסוג GET — עובד גם בלי JavaScript ומשאיר את המצב בכתובת. */
export function ListingFilters({
  values,
  resultCount,
}: {
  values: FilterValues;
  resultCount: number;
}) {
  const hasFilters = Object.values(values).some(Boolean);

  return (
    <Card as="section" padding="md">
      <form action="/listings" method="get">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Select
            label="עיר"
            name="city"
            defaultValue={values.city ?? ''}
            className="col-span-2 sm:col-span-1"
          >
            <option value="">כל הערים</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>

          <Select label="מחדרים" name="minRooms" defaultValue={values.minRooms ?? ''}>
            <option value="">הכול</option>
            {ROOM_OPTIONS.map((rooms) => (
              <option key={rooms} value={rooms}>
                {rooms}
              </option>
            ))}
          </Select>

          <Select label="עד חדרים" name="maxRooms" defaultValue={values.maxRooms ?? ''}>
            <option value="">הכול</option>
            {ROOM_OPTIONS.map((rooms) => (
              <option key={rooms} value={rooms}>
                {rooms}
              </option>
            ))}
          </Select>

          <Select label="משווי" name="minValue" defaultValue={values.minValue ?? ''}>
            <option value="">הכול</option>
            {VALUE_STEPS.map((value) => (
              <option key={value} value={value}>
                {formatCurrency(value)}
              </option>
            ))}
          </Select>

          <Select label="עד שווי" name="maxValue" defaultValue={values.maxValue ?? ''}>
            <option value="">הכול</option>
            {VALUE_STEPS.map((value) => (
              <option key={value} value={value}>
                {formatCurrency(value)}
              </option>
            ))}
          </Select>

          <Select
            label="מחפש דירה ב…"
            name="wantedCity"
            defaultValue={values.wantedCity ?? ''}
            className="col-span-2 sm:col-span-1"
          >
            <option value="">לא משנה</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit">סינון</Button>
          {hasFilters && (
            <Link
              href="/listings"
              className="text-caption font-medium text-ink-500 hover:text-ink-800"
            >
              ניקוי הסינון
            </Link>
          )}
          <span className="mr-auto text-caption text-ink-500">
            <span className="num">{resultCount}</span> מודעות
          </span>
        </div>
      </form>
    </Card>
  );
}
