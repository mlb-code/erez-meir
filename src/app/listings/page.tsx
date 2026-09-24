import type { Metadata } from 'next';
import { ListingCard } from '@/components/listing-card';
import { EmptyState, PageHeader } from '@/components/ui';
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
    <div className="mx-auto max-w-5xl px-gutter py-8">
      <PageHeader
        title="לוח ההחלפות"
        description="בכל מודעה מופיע גם מה הבעלים מחפש בתמורה — כך אפשר לראות מיד אם יש כאן החלפה אפשרית, ולא רק דירה למכירה."
        className="mb-6"
      />

      <ListingFilters values={values} resultCount={listings.length} />

      {listings.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="לא נמצאו מודעות שמתאימות לסינון"
          description="אפשר להרחיב את הטווחים או לנקות את הסינון ולהתחיל מחדש."
        />
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
