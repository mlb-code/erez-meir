import type { Metadata } from 'next';
import { ListingCard } from '@/components/listing-card';
import { getActiveListings, type BoardFilters } from '@/lib/data/listings';
import { ListingFilters, type FilterValues } from './filters';

export const metadata: Metadata = {
  title: 'לוח ההחלפות',
  description: 'כל הדירות שמפורסמות להחלפה — ומה כל בעלים מחפש בתמורה.',
};

const toNumber = (value?: string) => {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) ? parsed : undefined;
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<FilterValues>;
}) {
  const values = await searchParams;

  const filters: BoardFilters = {
    city: values.city || undefined,
    minRooms: toNumber(values.minRooms),
    maxRooms: toNumber(values.maxRooms),
    minValue: toNumber(values.minValue),
    maxValue: toNumber(values.maxValue),
    wantedCity: values.wantedCity || undefined,
  };

  const listings = await getActiveListings(filters);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">לוח ההחלפות</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          בכל מודעה מופיע גם מה הבעלים מחפש בתמורה — כך אפשר לראות מיד אם יש כאן החלפה אפשרית,
          ולא רק דירה למכירה.
        </p>
      </header>

      <ListingFilters values={values} resultCount={listings.length} />

      {listings.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          לא נמצאו מודעות שמתאימות לסינון. אפשר להרחיב את הטווחים או לנקות את הסינון.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
