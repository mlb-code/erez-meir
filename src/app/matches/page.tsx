import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MatchCard } from '@/components/match-card';
import { Alert, Badge, Button, ButtonLink, Card, EmptyState, PageHeader, cx } from '@/components/ui';
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
  const awaitingOwnership = myListings.some((listing) => listing.status === 'pending_ownership');
  const noMatchWithRequested =
    withListing &&
    !matches.some((match) =>
      match.participants.some((participant) => participant.listing.id === withListing),
    );

  return (
    <div className="mx-auto max-w-3xl px-gutter py-8">
      <PageHeader
        title="ההתאמות שלי"
        description="כאן מופיעות ההחלפות שהמערכת מצאה — גם כאלה שמערבות שלושה וארבעה בעלי דירות."
        actions={
          <form action={refreshMatches}>
            <Button type="submit" variant="secondary">
              חיפוש התאמות מחדש
            </Button>
          </form>
        }
      />

      {!hasActiveListing && (
        <Card tone="brand" className="mt-6">
          {awaitingOwnership ? (
            <>
              <p className="text-body font-bold text-brand-900">
                המודעה שלך ממתינה לאימות בעלות.
              </p>
              <p className="mt-1 text-caption text-brand-800">
                רק נכס מאומת נכנס למנוע ההתאמות — זה מה שמבדיל את חליפין מלוח מודעות. נעדכן
                אותך ברגע שהבדיקה תסתיים.
              </p>
              <ButtonLink href="/account" className="mt-3">
                לאזור האישי
              </ButtonLink>
            </>
          ) : (
            <>
              <p className="text-body font-bold text-brand-900">עוד אין לך מודעה פעילה.</p>
              <p className="mt-1 text-caption text-brand-800">
                מעגלי החלפה נבנים בין מודעות. ברגע שתפרסם את הנכס שלך, נוכל לשבץ אותך בהם.
              </p>
              <ButtonLink href="/new" className="mt-3">
                לפרסום מודעה
              </ButtonLink>
            </>
          )}
        </Card>
      )}

      {noMatchWithRequested && (
        <Alert tone="warning" className="mt-6">
          בין הדירה שלך לדירה שסימנת אין כרגע החלפה אפשרית — לא ישירה ולא דרך מעגל. ההתאמות
          מתעדכנות בכל פעם שמתפרסמת או מתעדכנת מודעה, אז שווה לבדוק שוב בהמשך.
        </Alert>
      )}

      <nav className="mt-6 flex gap-2 rounded-field bg-ink-100 p-1">
        <TabLink
          href="/matches"
          active={activeTab === 'direct'}
          label="התאמות ישירות"
          count={direct.length}
        />
        <TabLink
          href="/matches?tab=chains"
          active={activeTab === 'chains'}
          label="שרשראות"
          count={chains.length}
        />
      </nav>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={activeTab === 'chains' ? 'עדיין אין שרשראות שאתה חלק מהן' : 'עדיין אין התאמות ישירות'}
          description={
            activeTab === 'chains'
              ? 'שרשרת נוצרת כשמעגל של שלושה עד חמישה בעלי דירות מסתדר — זה קורה ככל שיש יותר מודעות במערכת.'
              : 'אפשר לבדוק גם בלשונית השרשראות.'
          }
        />
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
      className={cx(
        'flex flex-1 items-center justify-center gap-2 rounded-chip px-4 py-2.5 text-caption font-bold transition-colors',
        active ? 'bg-surface text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-800',
      )}
    >
      {label}
      <Badge tone={active ? 'brand' : 'neutral'} className="num">
        {count}
      </Badge>
    </Link>
  );
}
