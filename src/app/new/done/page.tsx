import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MatchCard } from '@/components/match-card';
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
  const matches = (await getMyMatches(user.id)).filter(
    (match) => !id || match.myListingId === id,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-brand-950">המודעה פורסמה</h1>
        <p className="mt-2 text-brand-800">
          {matches.length > 0
            ? `כבר עכשיו מצאנו ${matches.length} ${matches.length === 1 ? 'התאמה' : 'התאמות'} עבורך.`
            : 'עוד לא נמצאה התאמה. המערכת בודקת מחדש בכל פעם שמתפרסמת או מתעדכנת מודעה.'}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/matches"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            למסך ההתאמות
          </Link>
          {id && (
            <Link
              href={`/listings/${id}`}
              className="rounded-xl border border-brand-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              לצפייה במודעה
            </Link>
          )}
        </div>
      </div>

      {matches.length > 0 && (
        <div className="mt-8 flex flex-col gap-5">
          <h2 className="text-lg font-extrabold text-slate-900">ההתאמות שנמצאו</h2>
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
