import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MatchCard } from '@/components/match-card';
import { refreshMatches } from '@/lib/actions/matching';
import { getMyMatches } from '@/lib/data/matches';
import { getMyListings } from '@/lib/data/listings';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'ההתאמות שלי' };

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; with?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/matches');

  const { tab, with: withListing } = await searchParams;
  const [matches, myListings] = await Promise.all([
    getMyMatches(user.id),
    getMyListings(user.id),
  ]);

  const direct = matches.filter((match) => match.match_type === 'direct');
  const chains = matches.filter((match) => match.match_type === 'chain');
  const activeTab = tab === 'chains' ? 'chains' : 'direct';
  const visible = activeTab === 'chains' ? chains : direct;

  const hasActiveListing = myListings.some((listing) => listing.status === 'active');
  const noMatchWithRequested =
    withListing &&
    !matches.some((match) =>
      match.participants.some((participant) => participant.listing.id === withListing),
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">ההתאמות שלי</h1>
          <p className="mt-2 max-w-xl text-slate-600">
            כאן מופיעות ההחלפות שהמערכת מצאה — גם כאלה שמערבות שלושה וארבעה בעלי דירות.
          </p>
        </div>
        <form action={refreshMatches}>
          <button
            type="submit"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            חיפוש התאמות מחדש
          </button>
        </form>
      </header>

      {!hasActiveListing && (
        <div className="mt-6 rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-5">
          <p className="font-bold text-brand-900">עוד אין לך מודעה פעילה.</p>
          <p className="mt-1 text-sm text-brand-800">
            מעגלי החלפה נבנים בין מודעות. ברגע שתפרסם את הדירה שלך, נוכל לשבץ אותך בהם.
          </p>
          <Link
            href="/new"
            className="mt-3 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            לפרסום מודעה
          </Link>
        </div>
      )}

      {noMatchWithRequested && (
        <p className="mt-6 rounded-2xl border border-chain-200 bg-chain-50 p-4 text-sm text-chain-900">
          בין הדירה שלך לדירה שסימנת אין כרגע החלפה אפשרית — לא ישירה ולא דרך מעגל. ההתאמות
          מתעדכנות בכל פעם שמתפרסמת או מתעדכנת מודעה, אז שווה לבדוק שוב בהמשך.
        </p>
      )}

      <nav className="mt-6 flex gap-2 rounded-xl bg-slate-100 p-1">
        <TabLink href="/matches" active={activeTab === 'direct'} label="התאמות ישירות" count={direct.length} />
        <TabLink href="/matches?tab=chains" active={activeTab === 'chains'} label="שרשראות" count={chains.length} />
      </nav>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          {activeTab === 'chains'
            ? 'עדיין אין שרשראות שאתה חלק מהן. שרשרת נוצרת כשמעגל של שלושה עד חמישה בעלי דירות מסתדר — זה קורה ככל שיש יותר מודעות במערכת.'
            : 'עדיין אין התאמות ישירות. אפשר לבדוק גם בלשונית השרשראות.'}
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          {visible.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {label}
      <span
        className={`num rounded-md px-1.5 py-0.5 text-xs ${
          active ? 'bg-brand-100 text-brand-800' : 'bg-slate-200 text-slate-600'
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
