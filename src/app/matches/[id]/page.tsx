import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Chat } from './chat';
import { ChainDiagram } from '@/components/chain-diagram';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { LEGAL_DISCLAIMER, isOpenMatchState } from '@/lib/constants';
import { getMatchById } from '@/lib/data/matches';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { Message } from '@/lib/types';

export const metadata: Metadata = { title: 'צ׳אט ההחלפה' };

export default async function MatchChatPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/matches');

  const { id } = await params;
  const match = await getMatchById(user.id, id);
  if (!match) notFound();

  const isOpen = isOpenMatchState(match.status);

  let messages: Message[] = [];
  if (isOpen) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('messages')
      .select('id, match_id, sender_id, body, created_at')
      .eq('match_id', id)
      .order('created_at', { ascending: true });
    messages = (data ?? []) as Message[];
  }

  const names: Record<string, string> = {};
  for (const participant of match.participants) {
    if (participant.ownerName) names[participant.listing.owner_id] = participant.ownerName;
  }

  return (
    <div className="mx-auto max-w-3xl px-gutter py-8">
      <PageHeader
        title={match.match_type === 'direct' ? 'החלפה ישירה' : `שרשרת של ${match.totalCount}`}
        backHref="/matches"
        backLabel="חזרה להתאמות"
      />

      <Card as="section" className="mt-5">
        <h2 className="mb-3 text-caption font-bold text-ink-500">מסלול ההחלפה</h2>
        <ChainDiagram participants={match.participants} steps={match.steps} />
      </Card>

      <section className="mt-6">
        <h2 className="mb-3 text-heading text-ink-900">
          {isOpen ? 'צ׳אט משותף' : 'הצ׳אט עדיין סגור'}
        </h2>

        {isOpen ? (
          <Chat
            matchId={match.id}
            currentUserId={user.id}
            names={names}
            initialMessages={messages}
          />
        ) : (
          <EmptyState
            title="הצ׳אט הקבוצתי עדיין נעול"
            description={`הוא נפתח רק אחרי שכל המשתתפים במעגל סימנו "מעוניין". כרגע אישרו ${match.interestedCount} מתוך ${match.totalCount}.`}
            icon={
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            }
          />
        )}
      </section>

      <p className="mt-6 rounded-field bg-ink-100 p-4 text-xs leading-relaxed text-ink-500">
        {LEGAL_DISCLAIMER}
      </p>
    </div>
  );
}
