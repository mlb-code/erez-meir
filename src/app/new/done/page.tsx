import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MatchCard } from '@/components/match-card';
import { ButtonLink, Card } from '@/components/ui';
import { getMyMatches } from '@/lib/data/matches';
import { getListingById } from '@/lib/data/listings';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'המודעה נשלחה' };

export default async function ListingPublishedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { id } = await searchParams;
  const listing = id ? await getListingById(id) : null;

  // מודעה שזה עתה פורסמה ממתינה לאימות בעלות — היא עוד לא במנוע ההתאמות (§4.2).
  const awaitingOwnership = listing?.status === 'pending_ownership';

  const matches = awaitingOwnership
    ? []
    : (await getMyMatches(user.id)).filter((match) => !id || match.myListingId === id);

  return (
    <div className="mx-auto max-w-3xl px-gutter py-10">
      <Card tone="brand" padding="lg" className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-pill bg-brand-600">
          <Icon awaitingOwnership={awaitingOwnership} />
        </div>

        <h1 className="mt-4 text-title text-brand-950">
          {awaitingOwnership ? 'המודעה בבדיקת בעלות' : 'המודעה עודכנה'}
        </h1>

        <p className="mt-2 text-body text-brand-800">
          {awaitingOwnership
            ? 'כל הפרטים נשמרו. לפני שהנכס עולה לאוויר אנחנו מאמתים שהוא באמת שלך — זה מה שמבדיל את חליפין מלוח מודעות.'
            : matches.length > 0
              ? `כבר עכשיו מצאנו ${matches.length} ${matches.length === 1 ? 'התאמה' : 'התאמות'} עבורך.`
              : 'עוד לא נמצאה התאמה. המערכת בודקת מחדש בכל פעם שמתפרסמת או מתעדכנת מודעה.'}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <ButtonLink href={awaitingOwnership ? '/account' : '/matches'}>
            {awaitingOwnership ? 'לאזור האישי' : 'למסך ההתאמות'}
          </ButtonLink>
          {id && (
            <ButtonLink href={`/listings/${id}`} variant="secondary">
              לצפייה במודעה
            </ButtonLink>
          )}
        </div>
      </Card>

      {awaitingOwnership && (
        <Card as="section" padding="lg" className="mt-6" title="מה קורה עכשיו">
          <ol className="flex flex-col gap-3 text-body text-ink-700">
            <Step number={1} title="העלאת נסח טאבו או אישור זכויות">
              מסמך שאינו ישן מ-90 יום, שבו מופיע מספר תעודת הזהות שלך כבעל הזכות.
            </Step>
            <Step number={2} title="בדיקה אנושית">
              מנהל התפעול משווה בין הנסח, מה שהצהרת ותעודת הזהות שלך. היעד: יום עסקים אחד.
            </Step>
            <Step number={3} title="הנכס עולה לאוויר">
              רק אז המודעה מופיעה בלוח ונכנסת למנוע ההתאמות, ומתחילים לחפש לך מעגלי החלפה.
            </Step>
          </ol>
        </Card>
      )}

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

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-brand-100 text-caption font-bold text-brand-700">
        {number}
      </span>
      <span className="min-w-0">
        <span className="block font-bold text-ink-900">{title}</span>
        <span className="block text-caption leading-relaxed text-ink-600">{children}</span>
      </span>
    </li>
  );
}

function Icon({ awaitingOwnership }: { awaitingOwnership: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {awaitingOwnership ? (
        <>
          <path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
          <path d="M9.2 12.2l1.9 1.9 3.7-3.9" />
        </>
      ) : (
        <path d="M5 13l4 4L19 7" />
      )}
    </svg>
  );
}
