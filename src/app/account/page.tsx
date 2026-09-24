import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DeleteListingButton } from './delete-listing-button';
import { ProfileForm } from './profile-form';
import { STATUS_LABELS } from '@/lib/constants';
import { formatCurrency, formatRooms, photoUrl } from '@/lib/format';
import { setListingStatus } from '@/lib/actions/listings';
import { getMyListings } from '@/lib/data/listings';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { ListingStatus, Profile } from '@/lib/types';

export const metadata: Metadata = { title: 'האזור האישי' };

const STATUS_STYLES: Record<ListingStatus, string> = {
  draft: 'bg-ink-200 text-ink-700',
  pending_ownership: 'bg-chain-100 text-chain-800',
  ownership_rejected: 'bg-danger-100 text-danger-800',
  closing: 'bg-brand-100 text-brand-800',
  active: 'bg-success-100 text-success-800',
  in_negotiation: 'bg-chain-100 text-chain-800',
  swapped: 'bg-brand-100 text-brand-800',
  archived: 'bg-ink-200 text-ink-500',
};

/** לאיזה סטטוס אפשר לעבור מכל סטטוס. */
const NEXT_STATUSES: Record<ListingStatus, ListingStatus[]> = {
  draft: [],
  pending_ownership: [],
  ownership_rejected: [],
  closing: ['swapped'],
  active: ['in_negotiation', 'archived'],
  in_negotiation: ['active', 'swapped', 'archived'],
  swapped: ['archived'],
  archived: ['active'],
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/account');

  const supabase = await createClient();
  const [{ data: profile }, listings] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    getMyListings(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">האזור האישי</h1>

      <section className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-ink-900">הפרטים שלי</h2>
        <ProfileForm profile={profile as Profile | null} email={user.email ?? ''} />
        <div className="mt-4 flex flex-wrap gap-3 border-t border-ink-100 pt-4 text-sm">
          <Link href="/documents/terms" className="font-semibold text-brand-700 hover:underline">תנאי השירות</Link>
          <Link href="/documents/privacy" className="font-semibold text-brand-700 hover:underline">מדיניות הפרטיות</Link>
          <span className="text-ink-400">— צפייה וחתימה דיגיטלית</span>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink-900">המודעות שלי</h2>
          <Link
            href="/new"
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            פרסום מודעה חדשה
          </Link>
        </div>

        {listings.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
            עוד לא פרסמת מודעה. ברגע שתפרסם, נתחיל לחפש עבורך התאמות ומעגלי החלפה.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {listings.map((listing) => {
              const cover = listing.listing_photos?.[0];
              const status = listing.status;

              return (
                <li
                  key={listing.id}
                  className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    {cover ? (
                      <img
                        src={photoUrl(cover.storage_path)}
                        alt=""
                        className="h-20 w-24 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-xs text-ink-400">
                        ללא תמונה
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-ink-900">
                          {formatRooms(listing.rooms)} ב{listing.city}
                        </h3>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[status]}`}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-500">
                        {listing.size_sqm} מ״ר
                        {listing.neighborhood ? ` · ${listing.neighborhood}` : ''}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-brand-700">
                        {listing.asking_value !== null
                          ? formatCurrency(listing.asking_value)
                          : 'טרם הוגדר שווי'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                    <Link
                      href={`/new?id=${listing.id}&step=1`}
                      className="rounded-lg border border-ink-300 px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
                    >
                      {status === 'draft' ? 'המשך מילוי הטיוטה' : 'עריכה'}
                    </Link>

                    {status !== 'draft' && (
                      <Link
                        href={`/listings/${listing.id}`}
                        className="rounded-lg border border-ink-300 px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
                      >
                        צפייה במודעה
                      </Link>
                    )}

                    {NEXT_STATUSES[status].map((next) => (
                      <form key={next} action={setListingStatus}>
                        <input type="hidden" name="listing_id" value={listing.id} />
                        <input type="hidden" name="status" value={next} />
                        <button
                          type="submit"
                          className="rounded-lg border border-ink-300 px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
                        >
                          סימון כ{STATUS_LABELS[next]}
                        </button>
                      </form>
                    ))}

                    <div className="mr-auto">
                      <DeleteListingButton listingId={listing.id} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
