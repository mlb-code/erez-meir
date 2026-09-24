import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert } from '@/components/ui';
import { Stepper } from './stepper';
import { StepDetails } from './step-details';
import { StepPhotos } from './step-photos';
import { StepValue } from './step-value';
import { StepWanted } from './step-wanted';
import { getNeighborhoodsByCity } from '@/lib/data/neighborhoods';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { ListingWithPhotos } from '@/lib/types';

export const metadata: Metadata = { title: 'פרסום נכס להחלפה' };

const TITLES = [
  'מה יש לי — פרטי הנכס',
  'תמונות הנכס',
  'השווי המוצהר',
  'מה אני מחפש בתמורה',
];

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; step?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/new');

  const { id, step: stepParam } = await searchParams;
  const supabase = await createClient();

  let listing: ListingWithPhotos | null = null;
  if (id) {
    const { data } = await supabase
      .from('listings')
      .select('*, listing_photos(id, listing_id, storage_path, sort_order, is_exterior)')
      .eq('id', id)
      .maybeSingle();

    if (!data || (data as { owner_id: string }).owner_id !== user.id) redirect('/new');
    listing = data as unknown as ListingWithPhotos;
    listing.listing_photos = (listing.listing_photos ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    );
  }

  const step = Math.min(4, Math.max(1, Number(stepParam) || 1));
  if (step > 1 && !listing) redirect('/new');

  // רשימת השכונות הסגורה (§4.3) — נטענת פעם אחת ומוזנת לצעדים שצריכים אותה.
  const neighborhoodsByCity =
    step === 1 || step === 4 ? await getNeighborhoodsByCity() : {};

  // טיוטה קיימת שלא הושלמה — מציעים להמשיך אותה במקום לפתוח מודעה חדשה
  let openDraft: { id: string; city: string } | null = null;
  if (!listing) {
    const { data } = await supabase
      .from('listings')
      .select('id, city')
      .eq('owner_id', user.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    openDraft = data;
  }

  return (
    <div className="mx-auto max-w-2xl px-gutter py-8">
      <Stepper current={step} listingId={listing?.id} />

      <h1 className="mt-6 text-title text-ink-900">{TITLES[step - 1]}</h1>
      {listing && listing.status !== 'draft' && (
        <p className="mt-1 text-caption text-ink-500">
          אתה עורך מודעה קיימת. השינויים ייכנסו לתוקף מיד עם השמירה.
        </p>
      )}

      {openDraft && (
        <div className="mt-4">
          <Alert tone="warning" title={`יש לך טיוטה שלא הושלמה (${openDraft.city}).`}>
            <Link href={`/new?id=${openDraft.id}&step=1`} className="font-bold underline">
              להמשיך אותה
            </Link>
          </Alert>
        </div>
      )}

      <div className="mt-6">
        {step === 1 && (
          <StepDetails listing={listing} neighborhoodsByCity={neighborhoodsByCity} />
        )}
        {step === 2 && listing && (
          <StepPhotos listingId={listing.id} userId={user.id} photos={listing.listing_photos} />
        )}
        {step === 3 && listing && <StepValue listing={listing} />}
        {step === 4 && listing && (
          <StepWanted listing={listing} neighborhoodsByCity={neighborhoodsByCity} />
        )}
      </div>
    </div>
  );
}
