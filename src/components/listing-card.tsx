import Link from 'next/link';
import { formatCurrency, formatRooms, photoUrl } from '@/lib/format';
import {
  describeCashFlexibility,
  describeWantedSummary,
  listingFeatures,
} from '@/lib/listing-text';
import type { ListingWithPhotos } from '@/lib/types';

export function ListingCard({ listing }: { listing: ListingWithPhotos }) {
  const cover = listing.listing_photos?.[0];
  const features = listingFeatures(listing);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-16/10 bg-slate-100">
        {cover ? (
          <img
            src={photoUrl(cover.storage_path)}
            alt={`דירה ב${listing.city}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            ללא תמונה
          </div>
        )}
        <span className="absolute bottom-2 right-2 rounded-lg bg-slate-900/80 px-2.5 py-1 text-sm font-bold text-white">
          {formatCurrency(listing.asking_value)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold text-slate-900">
          {formatRooms(listing.rooms)} ב{listing.city}
        </h3>
        <p className="mt-0.5 text-sm text-slate-500">
          {listing.neighborhood ?? 'ללא שכונה'} · {listing.size_sqm} מ״ר
          {listing.floor !== null && ` · קומה ${listing.floor}`}
        </p>

        {features.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {features.map((feature) => (
              <li
                key={feature}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
              >
                {feature}
              </li>
            ))}
          </ul>
        )}

        {/* זה מה שמבדיל את הלוח הזה מלוח מודעות רגיל */}
        <div className="mt-4 flex-1 rounded-xl bg-brand-50 p-3">
          <p className="text-xs font-bold text-brand-800">מחפש בתמורה</p>
          <p className="mt-1 text-sm leading-relaxed text-brand-900">
            {describeWantedSummary(listing)}
          </p>
          <p className="mt-1.5 text-xs text-brand-700">{describeCashFlexibility(listing)}</p>
        </div>
      </div>
    </Link>
  );
}
