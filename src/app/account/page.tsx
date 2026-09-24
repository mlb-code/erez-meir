import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DeleteListingButton } from './delete-listing-button';
import { ProfileForm } from './profile-form';
import { Badge, Button, ButtonLink, Card, EmptyState, PageHeader, type BadgeTone } from '@/components/ui';
import { STATUS_LABELS } from '@/lib/constants';
import { formatCurrency, photoUrl } from '@/lib/format';
import { setListingStatus } from '@/lib/actions/listings';
import { getMyListings } from '@/lib/data/listings';
import { listingTitle } from '@/lib/listing-text';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { ListingStatus, Profile } from '@/lib/types';

export const metadata: Metadata = { title: 'האזור האישי' };

const STATUS_TONES: Record<ListingStatus, BadgeTone> = {
  draft: 'neutral',
  pending_ownership: 'warning',
  ownership_rejected: 'danger',
  closing: 'brand',
  active: 'success',
  in_negotiation: 'chain',
  swapped: 'brand',
  archived: 'neutral',
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
    <div className="mx-auto max-w-3xl px-gutter py-8">
      <PageHeader title="האזור האישי" />

      <Card as="section" padding="lg" title="הפרטים שלי" className="mt-6">
        <ProfileForm profile={profile as Profile | null} email={user.email ?? ''} />
        <div className="mt-4 flex flex-wrap gap-3 border-t border-ink-100 pt-4 text-caption">
          <Link href="/documents/terms" className="font-semibold text-brand-700 hover:underline">
            תנאי השירות
          </Link>
          <Link href="/documents/privacy" className="font-semibold text-brand-700 hover:underline">
            מדיניות הפרטיות
          </Link>
          <span className="text-ink-400">— צפייה וחתימה דיגיטלית</span>
        </div>
      </Card>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-heading text-ink-900">המודעות שלי</h2>
          <ButtonLink href="/new">פרסום מודעה חדשה</ButtonLink>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="עוד לא פרסמת מודעה"
            description="ברגע שתפרסם, נתחיל לחפש עבורך התאמות ומעגלי החלפה."
            action={<ButtonLink href="/new">לפרסום מודעה</ButtonLink>}
          />
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {listings.map((listing) => {
              const cover = listing.listing_photos?.[0];
              const status = listing.status;

              return (
                <Card as="li" key={listing.id}>
                  <div className="flex gap-3">
                    {cover ? (
                      <img
                        src={photoUrl(cover.storage_path)}
                        alt=""
                        className="h-20 w-24 shrink-0 rounded-field object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-field bg-ink-100 text-xs text-ink-400">
                        ללא תמונה
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-body font-bold text-ink-900">
                          {listingTitle(listing)}
                        </h3>
                        <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
                      </div>
                      <p className="mt-1 text-caption text-ink-500">
                        {listing.size_sqm} מ״ר
                        {listing.neighborhood ? ` · ${listing.neighborhood}` : ''}
                      </p>
                      <p className="mt-0.5 text-caption font-semibold text-brand-700">
                        {listing.asking_value !== null
                          ? formatCurrency(listing.asking_value)
                          : 'טרם הוגדר שווי'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                    <ButtonLink
                      href={`/new?id=${listing.id}&step=1`}
                      variant="secondary"
                      size="sm"
                    >
                      {status === 'draft' ? 'המשך מילוי הטיוטה' : 'עריכה'}
                    </ButtonLink>

                    {status !== 'draft' && (
                      <ButtonLink href={`/listings/${listing.id}`} variant="secondary" size="sm">
                        צפייה במודעה
                      </ButtonLink>
                    )}

                    {NEXT_STATUSES[status].map((next) => (
                      <form key={next} action={setListingStatus}>
                        <input type="hidden" name="listing_id" value={listing.id} />
                        <input type="hidden" name="status" value={next} />
                        <Button type="submit" variant="secondary" size="sm">
                          סימון כ{STATUS_LABELS[next]}
                        </Button>
                      </form>
                    ))}

                    <div className="mr-auto">
                      <DeleteListingButton listingId={listing.id} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
