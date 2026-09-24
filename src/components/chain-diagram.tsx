import Link from 'next/link';
import { formatCurrency, formatRooms, photoUrl } from '@/lib/format';
import type { MatchParticipant, MatchStep } from '@/lib/data/matches';

/**
 * דיאגרמת המעגל — הליבה הוויזואלית של המוצר.
 * כל משתתף מוצג ככרטיס, ובין הכרטיסים חץ עם סכום ההשלמה של אותו מעבר.
 * החץ האחרון סוגר את המעגל וחוזר לדירה של המשתתף הראשון.
 */
export function ChainDiagram({
  participants,
  steps,
}: {
  participants: MatchParticipant[];
  steps: MatchStep[];
}) {
  return (
    <ol className="relative flex flex-col">
      {participants.map((participant, index) => {
        const { listing } = participant;
        const step = steps[index];
        const target = participants[(index + 1) % participants.length];
        const cover = listing.listing_photos?.[0];

        return (
          <li key={listing.id} className="flex flex-col">
            <div
              className={`flex items-center gap-3 rounded-card border p-3 ${
                participant.isMe
                  ? 'border-brand-300 bg-brand-50'
                  : 'border-ink-200 bg-white'
              }`}
            >
              <span
                className={`num flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-caption font-bold ${
                  participant.isMe ? 'bg-brand-600 text-white' : 'bg-ink-200 text-ink-600'
                }`}
              >
                {index + 1}
              </span>

              {cover && (
                <img
                  src={photoUrl(cover.storage_path)}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-field object-cover"
                />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-caption font-bold text-ink-900">
                    {participant.isMe
                      ? 'הדירה שלך'
                      : `הדירה של ${participantName(participant, index)}`}
                  </p>
                  <ResponseChip response={participant.response} />
                </div>
                <p className="text-caption text-ink-600">
                  {formatRooms(listing.rooms)} · {listing.city}
                  {listing.neighborhood ? `, ${listing.neighborhood}` : ''} · {listing.size_sqm} מ״ר
                </p>
                <p className="flex flex-wrap items-center gap-x-2 text-caption font-semibold text-ink-700">
                  {formatCurrency(listing.asking_value)}
                  {!participant.isMe && (
                    <Link
                      href={`/listings/${listing.id}`}
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      לצפייה במודעה
                    </Link>
                  )}
                </p>
              </div>
            </div>

            {/* החץ אל הדירה הבאה במעגל */}
            <div className="flex items-center gap-3 py-1 pr-4">
              <div className="flex w-8 justify-center">
                <span className="h-8 w-0.5 rounded bg-ink-300" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ink-500">
                  {participant.isMe ? 'אתה עובר' : `${participantName(participant, index)} עובר`}{' '}
                  {target.isMe
                    ? 'לדירה שלך'
                    : `לדירה של ${participantName(target, (index + 1) % participants.length)}`}
                </span>
                <CashBadge cash={step.cash} />
              </div>
            </div>
          </li>
        );
      })}

      <li className="flex items-center gap-3 rounded-card border border-dashed border-ink-300 bg-ink-50 p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-ink-200 text-ink-600">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12a8 8 0 1 1 3 6.2" strokeLinecap="round" />
            <path d="M3 20v-4h4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="text-caption font-semibold text-ink-600">
          המעגל נסגר — כל אחד מקבל דירה, אף אחד לא נשאר בלי.
        </p>
      </li>
    </ol>
  );
}

/**
 * שם להצגה. השם האמיתי נחשף רק אחרי שכל הצדדים אישרו (מדיניות RLS),
 * ועד אז מוצג כינוי ניטרלי לפי המיקום במעגל.
 */
function participantName(participant: MatchParticipant, index: number): string {
  return participant.ownerName ?? `בעל דירה ${index + 1}`;
}

function CashBadge({ cash }: { cash: number }) {
  if (cash === 0) {
    return (
      <span className="rounded-chip bg-ink-100 px-2 py-1 text-xs font-bold text-ink-600">
        ללא השלמה
      </span>
    );
  }
  const paying = cash > 0;
  return (
    <span
      className={`rounded-chip px-2 py-1 text-xs font-bold ${
        paying ? 'bg-chain-100 text-chain-800' : 'bg-success-100 text-success-800'
      }`}
    >
      {paying ? '↑ משלים ' : '↓ מקבל '}
      {formatCurrency(Math.abs(cash))}
    </span>
  );
}

function ResponseChip({ response }: { response: MatchParticipant['response'] }) {
  if (response === 'interested') {
    return (
      <span className="rounded-chip bg-success-100 px-2 py-0.5 text-xs font-bold text-success-800">
        מעוניין
      </span>
    );
  }
  if (response === 'not_interested') {
    return (
      <span className="rounded-chip bg-danger-100 px-2 py-0.5 text-xs font-bold text-danger-800">
        לא רלוונטי
      </span>
    );
  }
  return (
    <span className="rounded-chip bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-500">
      טרם ענה
    </span>
  );
}
