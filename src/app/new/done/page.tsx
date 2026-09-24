import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MatchCard } from '@/components/match-card';
import { ButtonLink, Card } from '@/components/ui';
import { getMyMatches } from '@/lib/data/matches';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'המודעה פורסמה' };

export default async function ListingPublishedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await searchParams;
  const matches = (await getMyMatches(user.id)).filter((match) => !id || match.myListingId === id);

  return (
    <div className="mx-auto max-w-3xl px-gutter py-10">
      <Card tone="brand" padding="lg" className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-pill bg-brand-600">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-7 w-7 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-4 text-title text-brand-950">המודעה פורסמה</h1>
        <p className="mt-2 text-body text-brand-800">
          {matches.length > 0
            ? `כבר עכשיו מצאנו ${matches.length} ${matches.length === 1 ? 'התאמה' : 'התאמות'} עבורך.`
            : 'עוד לא נמצאה התאמה. המערכת בודקת מחדש בכל פעם שמתפרסמת או מתעדכנת מודעה.'}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/matches">למסך ההתאמות</ButtonLink>
          {id && (
            <ButtonLink href={`/listings/${id}`} variant="secondary">
              לצפייה במודעה
            </ButtonLink>
          )}
        </div>
      </Card>

      {matches.length > 0 && (
        <div className="mt-8 flex flex-col gap-5">
          <h2 className="text-heading text-ink-900">ההתאמות שנמצאו</h2>
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
