import Link from 'next/link';
import { ChainDiagram } from '@/components/chain-diagram';
import { respondToMatch } from '@/lib/actions/matches';
import { LEGAL_DISCLAIMER, isOpenMatchState } from '@/lib/constants';
import type { EnrichedMatch } from '@/lib/data/matches';

const STATUS_TEXT: Record<EnrichedMatch['status'], { label: string; className: string }> = {
  suggested: { label: 'התאמה חדשה', className: 'bg-brand-100 text-brand-800' },
  interested_partial: {
    label: 'ממתין לשאר המשתתפים',
    className: 'bg-chain-100 text-chain-800',
  },
  all_interested: { label: 'כולם אישרו', className: 'bg-success-100 text-success-800' },
  meeting_confirmed: { label: 'אישור הפגשה נחתם', className: 'bg-success-100 text-success-800' },
  in_negotiation: { label: 'במשא ומתן בלעדי', className: 'bg-brand-100 text-brand-800' },
  closing: { label: 'בסגירה', className: 'bg-brand-100 text-brand-800' },
  swapped: { label: 'הוחלפה', className: 'bg-brand-200 text-brand-900' },
  dismissed: { label: 'ההתאמה נסגרה', className: 'bg-ink-200 text-ink-600' },
  expired: { label: 'פג תוקף', className: 'bg-ink-200 text-ink-500' },
};

export function MatchCard({ match }: { match: EnrichedMatch }) {
  const status = STATUS_TEXT[match.status];
  const isChain = match.match_type === 'chain';
  const canRespond = match.myResponse === null && !['dismissed', 'expired'].includes(match.status);

  return (
    <article className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center gap-2 border-b border-ink-100 px-4 py-3">
        <span
          className={`rounded-lg px-2.5 py-1 text-sm font-extrabold ${
            isChain ? 'bg-chain-100 text-chain-800' : 'bg-brand-100 text-brand-800'
          }`}
        >
          {isChain ? `שרשרת של ${match.totalCount}` : 'התאמה ישירה'}
        </span>
        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${status.className}`}>
          {status.label}
        </span>

        <span className="mr-auto text-sm font-bold text-ink-500">
          ציון התאמה {match.score}
        </span>
      </header>

      <div className="p-4">
        <ChainDiagram participants={match.participants} steps={match.steps} />

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink-100 pt-4">
          <p className="text-sm font-semibold text-ink-600">
            {match.interestedCount} מתוך {match.totalCount} אישרו
          </p>
          <div className="flex gap-1">
            {match.participants.map((participant, index) => (
              <span
                key={participant.listing.id}
                title={`משתתף ${index + 1}`}
                className={`h-2 w-8 rounded-full ${
                  participant.response === 'interested'
                    ? 'bg-success-500'
                    : participant.response === 'not_interested'
                      ? 'bg-danger-400'
                      : 'bg-ink-200'
                }`}
              />
            ))}
          </div>
        </div>

        {canRespond ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={respondToMatch} className="flex-1">
              <input type="hidden" name="match_id" value={match.id} />
              <input type="hidden" name="listing_id" value={match.myListingId} />
              <input type="hidden" name="response" value="interested" />
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-700"
              >
                מעוניין בהחלפה
              </button>
            </form>
            <form action={respondToMatch}>
              <input type="hidden" name="match_id" value={match.id} />
              <input type="hidden" name="listing_id" value={match.myListingId} />
              <input type="hidden" name="response" value="not_interested" />
              <button
                type="submit"
                className="rounded-xl border border-ink-300 bg-white px-4 py-3 text-base font-semibold text-ink-600 transition-colors hover:bg-ink-50"
              >
                לא רלוונטי
              </button>
            </form>
          </div>
        ) : isOpenMatchState(match.status) ? (
          <div className="mt-4 rounded-xl bg-success-50 p-4">
            <p className="font-bold text-success-900">כל המשתתפים אישרו. הצ&apos;אט הקבוצתי נפתח.</p>
            <ContactList match={match} />
            <Link
              href={`/matches/${match.id}`}
              className="mt-3 inline-block rounded-xl bg-success-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-success-800"
            >
              לצ&apos;אט המשותף
            </Link>
          </div>
        ) : match.status === 'dismissed' || match.status === 'expired' ? (
          <p className="mt-4 rounded-xl bg-ink-100 p-4 text-sm text-ink-600">
            {match.status === 'expired' ? 'אחת המודעות במעגל כבר לא פעילה, ולכן המעגל פג.' : 'אחד המשתתפים סימן שההחלפה לא רלוונטית, ולכן המעגל הזה נסגר.'}
          </p>
        ) : (
          <p className="mt-4 rounded-xl bg-chain-50 p-4 text-sm text-chain-900">
            סימנת שאתה מעוניין. מחכים לאישור של שאר המשתתפים במעגל — נעדכן אותך כאן.
          </p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-ink-400">{LEGAL_DISCLAIMER}</p>
      </div>
    </article>
  );
}

function ContactList({ match }: { match: EnrichedMatch }) {
  const others = match.participants.filter((participant) => !participant.isMe);
  if (!others.some((participant) => participant.ownerName || participant.ownerPhone)) return null;

  return (
    <ul className="mt-3 flex flex-col gap-1 text-sm text-success-900">
      {others.map((participant) => (
        <li key={participant.listing.id}>
          <span className="font-semibold">{participant.ownerName ?? 'בעל דירה'}</span>
          {participant.ownerPhone && (
            <>
              {' · '}
              <a href={`tel:${participant.ownerPhone}`} className="num underline">
                {participant.ownerPhone}
              </a>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
