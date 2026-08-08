import Link from 'next/link';
import { CITIES, ROOM_OPTIONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';

const VALUE_STEPS = [
  1_500_000, 2_000_000, 2_500_000, 3_000_000, 3_500_000, 4_000_000, 4_500_000, 5_000_000,
  6_000_000, 7_000_000, 8_000_000,
];

const selectClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 ' +
  'outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export interface FilterValues {
  city?: string;
  minRooms?: string;
  maxRooms?: string;
  minValue?: string;
  maxValue?: string;
  wantedCity?: string;
}

/** טופס סינון פשוט מסוג GET — עובד גם בלי JavaScript ומשאיר את המצב בכתובת. */
export function ListingFilters({ values, resultCount }: { values: FilterValues; resultCount: number }) {
  const hasFilters = Object.values(values).some(Boolean);

  return (
    <form
      action="/listings"
      method="get"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <label className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-xs font-semibold text-slate-600">עיר</span>
          <select name="city" defaultValue={values.city ?? ''} className={selectClass}>
            <option value="">כל הערים</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-600">מחדרים</span>
          <select name="minRooms" defaultValue={values.minRooms ?? ''} className={selectClass}>
            <option value="">הכול</option>
            {ROOM_OPTIONS.map((rooms) => (
              <option key={rooms} value={rooms}>
                {rooms}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-600">עד חדרים</span>
          <select name="maxRooms" defaultValue={values.maxRooms ?? ''} className={selectClass}>
            <option value="">הכול</option>
            {ROOM_OPTIONS.map((rooms) => (
              <option key={rooms} value={rooms}>
                {rooms}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-600">משווי</span>
          <select name="minValue" defaultValue={values.minValue ?? ''} className={selectClass}>
            <option value="">הכול</option>
            {VALUE_STEPS.map((value) => (
              <option key={value} value={value}>
                {formatCurrency(value)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-600">עד שווי</span>
          <select name="maxValue" defaultValue={values.maxValue ?? ''} className={selectClass}>
            <option value="">הכול</option>
            {VALUE_STEPS.map((value) => (
              <option key={value} value={value}>
                {formatCurrency(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-xs font-semibold text-slate-600">מחפש דירה ב…</span>
          <select name="wantedCity" defaultValue={values.wantedCity ?? ''} className={selectClass}>
            <option value="">לא משנה</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          סינון
        </button>
        {hasFilters && (
          <Link href="/listings" className="text-sm font-medium text-slate-500 hover:text-slate-800">
            ניקוי הסינון
          </Link>
        )}
        <span className="mr-auto text-sm text-slate-500">{resultCount} מודעות</span>
      </div>
    </form>
  );
}
