import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhotoGallery } from '@/components/photo-gallery';
import { CONDITION_LABELS, FEATURE_LABELS, LEGAL_DISCLAIMER, URBAN_RENEWAL_LABELS } from '@/lib/constants';
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/listings" className="text-sm font-medium text-brand-700 hover:underline">
        → חזרה ללוח ההחלפות
      </Link>

      <div className="mt-4">
        <PhotoGallery
          photos={listing.listing_photos}
          alt={`${formatRooms(listing.rooms)} ב${listing.city}`}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {formatRooms(listing.rooms)} ב{listing.city}
          </h1>
          <p className="mt-1 text-slate-500">{describeAddress(listing)}</p>
        </div>
        <div className="text-left">
          <p className="text-2xl font-extrabold text-brand-700">
            {formatCurrency(listing.asking_value)}
          </p>
          <p className="text-xs text-slate-500">{formatCurrencyExact(listing.asking_value)}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
        {specs.map((spec) => (
          <div key={spec.label} className="bg-white p-4">
            <dt className="text-xs font-semibold text-slate-500">{spec.label}</dt>
            <dd className="mt-1 text-sm font-bold text-slate-900">{spec.value}</dd>
          </div>
        ))}
      </dl>

      {features.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {features.map((feature) => (
            <li
              key={feature}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              {feature}
            </li>
          ))}
        </ul>
      )}

      {listing.description && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-slate-900">על הדירה</h2>
          <p className="mt-2 leading-relaxed whitespace-pre-line text-slate-700">
            {listing.description}
          </p>
        </section>
      )}

      {/* הבלוק שמבדיל את הפלטפורמה — מה הבעלים רוצה לקבל בתמורה */}
      <section className="mt-8 rounded-2xl border-2 border-brand-200 bg-brand-50 p-5">
        <h2 className="text-lg font-extrabold text-brand-900">מה הבעלים מחפש בתמורה</h2>

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

        <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm font-semibold text-brand-900">
          גמישות מזומן: {describeCashFlexibility(listing)}
        </p>
      </section>

      {/* קריאה לפעולה */}
      <section className="mt-6">
        {isMine ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-semibold text-slate-800">זו המודעה שלך.</p>
            <Link
              href="/account"
              className="mt-3 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              לעריכת המודעה
            </Link>
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-slate-700">
              כדי לבדוק אם הדירה שלך מתאימה להחלפה הזו צריך להתחבר ולפרסם מודעה.
            </p>
            <Link
              href={`/login?redirect=/listings/${listing.id}`}
              className="mt-3 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              יש לי דירה שמתאימה
            </Link>
          </div>
        ) : !hasActiveListing ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-slate-700">
              כדי להיכנס למעגלי ההחלפה צריך שתהיה לך מודעה פעילה משלך.
            </p>
            <Link
              href="/new"
              className="mt-3 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              לפרסום המודעה שלי
            </Link>
          </div>
        ) : (
          <form action={findMatchWith} className="rounded-2xl border border-slate-200 bg-white p-5">
            <input type="hidden" name="listing_id" value={listing.id} />
            <p className="text-slate-700">
              נבדוק אם יש בין הדירות שלכם החלפה ישירה, או מעגל שכולל עוד בעלי דירות.
            </p>
            <button
              type="submit"
              className="mt-3 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              יש לי דירה שמתאימה
            </button>
          </form>
        )}
      </section>

      <p className="mt-6 rounded-xl bg-slate-100 p-4 text-xs leading-relaxed text-slate-500">
        {LEGAL_DISCLAIMER}
      </p>
    </div>
  );
}
