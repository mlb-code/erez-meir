import { ChainDiagram } from '@/components/chain-diagram';
import { Alert, Badge, Button, ButtonLink, Card, cx, type BadgeTone } from '@/components/ui';
import { respondToMatch } from '@/lib/actions/matches';
import { LEGAL_DISCLAIMER, isOpenMatchState } from '@/lib/constants';
import type { EnrichedMatch } from '@/lib/data/matches';

const STATUS_TEXT: Record<EnrichedMatch['status'], { label: string; tone: BadgeTone }> = {
  suggested: { label: 'התאמה חדשה', tone: 'brand' },
  interested_partial: { label: 'ממתין לשאר המשתתפים', tone: 'warning' },
  all_interested: { label: 'כולם אישרו', tone: 'success' },
  meeting_confirmed: { label: 'אישור הפגשה נחתם', tone: 'success' },
  in_negotiation: { label: 'במשא ומתן בלעדי', tone: 'brand' },
  closing: { label: 'בסגירה', tone: 'brand' },
  swapped: { label: 'הוחלפה', tone: 'brand' },
  dismissed: { label: 'ההתאמה נסגרה', tone: 'neutral' },
  expired: { label: 'פג תוקף', tone: 'neutral' },
};

export function MatchCard({ match }: { match: EnrichedMatch }) {
  const status = STATUS_TEXT[match.status];
  const isChain = match.match_type === 'chain';
  const canRespond = match.myResponse === null && !['dismissed', 'expired'].includes(match.status);

  return (
    <Card as="article" padding="none" className="overflow-hidden">
      <header className="flex flex-wrap items-center gap-2 border-b border-ink-100 px-4 py-3">
        <Badge tone={isChain ? 'chain' : 'brand'} size="md">
          {isChain ? `שרשרת של ${match.totalCount}` : 'התאמה ישירה'}
        </Badge>
        <Badge tone={status.tone}>{status.label}</Badge>

        <span className="mr-auto text-caption font-bold text-ink-500">
          ציון התאמה <span className="num">{match.score}</span>
        </span>
      </header>

      <div className="p-4">
        <ChainDiagram participants={match.participants} steps={match.steps} />

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink-100 pt-4">
          <p className="text-caption font-semibold text-ink-600">
            <span className="num">{match.interestedCount}</span> מתוך{' '}
            <span className="num">{match.totalCount}</span> אישרו
          </p>
          <div className="flex gap-1">
            {match.participants.map((participant, index) => (
              <span
                key={participant.listing.id}
                title={`משתתף ${index + 1}`}
                className={cx(
                  'h-2 w-8 rounded-pill',
                  participant.response === 'interested'
                    ? 'bg-success-500'
                    : participant.response === 'not_interested'
                      ? 'bg-danger-400'
                      : 'bg-ink-200',
                )}
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
              <Button type="submit" size="lg" fullWidth>
                מעוניין בהחלפה
              </Button>
            </form>
            <form action={respondToMatch}>
              <input type="hidden" name="match_id" value={match.id} />
              <input type="hidden" name="listing_id" value={match.myListingId} />
              <input type="hidden" name="response" value="not_interested" />
              <Button type="submit" variant="secondary" size="lg">
                לא רלוונטי
              </Button>
            </form>
          </div>
        ) : isOpenMatchState(match.status) ? (
          <div className="mt-4 rounded-field bg-success-50 p-4">
            <p className="text-caption font-bold text-success-900">
              כל המשתתפים אישרו. הצ&apos;אט הקבוצתי נפתח.
            </p>
            <ContactList match={match} />
            <ButtonLink href={`/matches/${match.id}`} className="mt-3">
              לצ&apos;אט המשותף
            </ButtonLink>
          </div>
        ) : match.status === 'dismissed' || match.status === 'expired' ? (
          <Alert tone="info" className="mt-4">
            {match.status === 'expired'
              ? 'אחת המודעות במעגל כבר לא פעילה, ולכן המעגל פג.'
              : 'אחד המשתתפים סימן שההחלפה לא רלוונטית, ולכן המעגל הזה נסגר.'}
          </Alert>
        ) : (
          <Alert tone="warning" className="mt-4">
            סימנת שאתה מעוניין. מחכים לאישור של שאר המשתתפים במעגל — נעדכן אותך כאן.
          </Alert>
        )}

        <p className="mt-4 text-xs leading-relaxed text-ink-400">{LEGAL_DISCLAIMER}</p>
      </div>
    </Card>
  );
}

function ContactList({ match }: { match: EnrichedMatch }) {
  const others = match.participants.filter((participant) => !participant.isMe);
  if (!others.some((participant) => participant.ownerName || participant.ownerPhone)) return null;

  return (
    <ul className="mt-3 flex flex-col gap-1 text-caption text-success-900">
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
