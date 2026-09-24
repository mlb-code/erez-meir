import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhotoGallery } from '@/components/photo-gallery';
import { BackLink, Badge, Button, ButtonLink, Card } from '@/components/ui';
import {
  CONDITION_LABELS,
  FEATURE_LABELS,
  LEGAL_DISCLAIMER,
  URBAN_RENEWAL_LABELS,
} from '@/lib/constants';
import { formatCurrency, formatCurrencyExact, formatRooms } from '@/lib/format';
import {
  describeAddress,
  describeCashFlexibility,
  describeWantedRooms,
  listingFeatures,
} from '@/lib/listing-text';
import { findMatchWith } from '@/lib/actions/matching';
import { getListingById } from '@/lib/data/listings';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return { title: 'מודעה לא נמצאה' };
  return {
    title: `${formatRooms(listing.rooms)} ב${listing.city} להחלפה`,
    description: listing.description ?? undefined,
  };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const user = await getCurrentUser();
  const isMine = user?.id === listing.owner_id;

  // האם למשתמש המחובר יש מודעה פעילה משלו — תנאי לכפתור ההתאמה
  let hasActiveListing = false;
  if (user && !isMine) {
    const supabase = await createClient();
    const { count } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('status', 'active');
    hasActiveListing = (count ?? 0) > 0;
  }

  const features = listingFeatures(listing);

  const specs: { label: string; value: string }[] = [
    { label: 'חדרים', value: formatRooms(listing.rooms) },
    { label: 'שטח', value: `${listing.size_sqm} מ״ר` },
    {
      label: 'קומה',
      value:
        listing.floor === null
          ? '—'
          : listing.total_floors
            ? `${listing.floor} מתוך ${listing.total_floors}`
            : String(listing.floor),
    },
    { label: 'שנת בנייה', value: listing.building_year ? String(listing.building_year) : '—' },
    { label: 'מצב הדירה', value: CONDITION_LABELS[listing.condition] },
    { label: 'התחדשות עירונית', value: URBAN_RENEWAL_LABELS[listing.urban_renewal_status] },
  ];

  return (
    <div className="mx-auto max-w-4xl px-gutter py-8">
      <BackLink href="/listings">חזרה ללוח ההחלפות</BackLink>

      <div className="mt-4">
        <PhotoGallery
          photos={listing.listing_photos}
          alt={`${formatRooms(listing.rooms)} ב${listing.city}`}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title text-ink-900">
            {formatRooms(listing.rooms)} ב{listing.city}
          </h1>
          <p className="mt-1 text-body text-ink-500">{describeAddress(listing)}</p>
        </div>
        <div className="text-left">
          <p className="text-title text-brand-700">{formatCurrency(listing.asking_value)}</p>
          <p className="text-xs text-ink-500">{formatCurrencyExact(listing.asking_value)}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
        {specs.map((spec) => (
          <div key={spec.label} className="bg-surface p-4">
            <dt className="text-xs font-semibold text-ink-500">{spec.label}</dt>
            <dd className="mt-1 text-caption font-bold text-ink-900">{spec.value}</dd>
          </div>
        ))}
      </dl>

      {features.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {features.map((feature) => (
            <li key={feature}>
              <Badge tone="neutral" size="md">
                {feature}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {listing.description && (
        <section className="mt-6">
          <h2 className="text-heading text-ink-900">על הדירה</h2>
          <p className="mt-2 text-body leading-relaxed whitespace-pre-line text-ink-700">
            {listing.description}
          </p>
        </section>
      )}

      {/* הבלוק שמבדיל את הפלטפורמה — מה הבעלים רוצה לקבל בתמורה */}
      <Card as="section" tone="brand" padding="lg" className="mt-8 border-2">
        <h2 className="text-heading text-brand-900">מה הבעלים מחפש בתמורה</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-brand-700">אזורים</dt>
            <dd className="mt-1 font-bold text-brand-950">
              {listing.wanted_cities.length ? listing.wanted_cities.join(' · ') : 'כל אזור'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-brand-700">חדרים</dt>
            <dd className="mt-1 font-bold text-brand-950">{describeWantedRooms(listing)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-brand-700">שטח מינימלי</dt>
            <dd className="mt-1 font-bold text-brand-950">
              {listing.wanted_min_sqm !== null ? `${listing.wanted_min_sqm} מ״ר` : 'לא הוגדר'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-brand-700">חובה שיהיה</dt>
            <dd className="mt-1 font-bold text-brand-950">
              {listing.must_haves.length
                ? listing.must_haves.map((feature) => FEATURE_LABELS[feature]).join(' · ')
                : 'ללא דרישות מיוחדות'}
            </dd>
          </div>
        </dl>

        <p className="mt-4 rounded-field bg-surface/70 px-4 py-3 text-caption font-semibold text-brand-900">
          גמישות מזומן: {describeCashFlexibility(listing)}
        </p>
      </Card>

      {/* קריאה לפעולה */}
      <section className="mt-6">
        {isMine ? (
          <Card padding="lg">
            <p className="text-body font-semibold text-ink-800">זו המודעה שלך.</p>
            <ButtonLink href="/account" variant="secondary" className="mt-3">
              לעריכת המודעה
            </ButtonLink>
          </Card>
        ) : !user ? (
          <Card padding="lg">
            <p className="text-body text-ink-700">
              כדי לבדוק אם הדירה שלך מתאימה להחלפה הזו צריך להתחבר ולפרסם מודעה.
            </p>
            <ButtonLink href={`/login?redirect=/listings/${listing.id}`} className="mt-3">
              יש לי דירה שמתאימה
            </ButtonLink>
          </Card>
        ) : !hasActiveListing ? (
          <Card padding="lg">
            <p className="text-body text-ink-700">
              כדי להיכנס למעגלי ההחלפה צריך שתהיה לך מודעה פעילה משלך.
            </p>
            <ButtonLink href="/new" className="mt-3">
              לפרסום המודעה שלי
            </ButtonLink>
          </Card>
        ) : (
          <Card padding="lg">
            <form action={findMatchWith}>
              <input type="hidden" name="listing_id" value={listing.id} />
              <p className="text-body text-ink-700">
                נבדוק אם יש בין הדירה שלך לדירה הזו החלפה ישירה, או מעגל שכולל עוד בעלי דירות.
              </p>
              <Button type="submit" className="mt-3">
                יש לי דירה שמתאימה
              </Button>
            </form>
          </Card>
        )}
      </section>

      <p className="mt-6 rounded-field bg-ink-100 p-4 text-xs leading-relaxed text-ink-500">
        {LEGAL_DISCLAIMER}
      </p>
    </div>
  );
}
