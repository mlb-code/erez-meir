import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Stepper } from './stepper';
import { StepDetails } from './step-details';
import { StepPhotos } from './step-photos';
import { StepValue } from './step-value';
import { StepWanted } from './step-wanted';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { ListingWithPhotos } from '@/lib/types';

export const metadata: Metadata = { title: 'פרסום מודעה להחלפה' };

const TITLES = [
  'מה יש לי — פרטי הדירה',
  'תמונות הדירה',
  'השווי המבוקש',
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
      .select('*, listing_photos(id, listing_id, storage_path, sort_order)')
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Stepper current={step} listingId={listing?.id} />

      <h1 className="mt-6 text-2xl font-extrabold text-slate-900">{TITLES[step - 1]}</h1>
      {listing && listing.status !== 'draft' && (
        <p className="mt-1 text-sm text-slate-500">
          אתה עורך מודעה שכבר פורסמה. השינויים ייכנסו לתוקף מיד עם השמירה.
        </p>
      )}

      {openDraft && (
        <div className="mt-4 rounded-2xl border border-chain-200 bg-chain-50 p-4">
          <p className="text-sm font-semibold text-chain-900">
            יש לך טיוטה שלא הושלמה ({openDraft.city}).
          </p>
          <Link
            href={`/new?id=${openDraft.id}&step=1`}
            className="mt-2 inline-block text-sm font-bold text-chain-800 underline"
          >
            להמשיך אותה
          </Link>
        </div>
      )}

      <div className="mt-6">
        {step === 1 && <StepDetails listing={listing} />}
        {step === 2 && listing && (
          <StepPhotos listingId={listing.id} userId={user.id} photos={listing.listing_photos} />
        )}
        {step === 3 && listing && <StepValue listing={listing} />}
        {step === 4 && listing && <StepWanted listing={listing} />}
      </div>
    </div>
  );
}
