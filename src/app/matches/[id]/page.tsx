import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Chat } from './chat';
import { ChainDiagram } from '@/components/chain-diagram';
import { LEGAL_DISCLAIMER } from '@/lib/constants';
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

  const isOpen = match.status === 'all_interested';

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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/matches" className="text-sm font-medium text-brand-700 hover:underline">
        → חזרה להתאמות
      </Link>

      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
        {match.match_type === 'direct' ? 'החלפה ישירה' : `שרשרת של ${match.totalCount}`}
      </h1>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-slate-500">מסלול ההחלפה</h2>
        <ChainDiagram participants={match.participants} steps={match.steps} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-extrabold text-slate-900">
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
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            הצ׳אט הקבוצתי נפתח רק אחרי שכל המשתתפים במעגל סימנו &quot;מעוניין&quot;. כרגע אישרו{' '}
            <span className="font-bold">
              {match.interestedCount} מתוך {match.totalCount}
            </span>
            .
          </p>
        )}
      </section>

      <p className="mt-6 rounded-xl bg-slate-100 p-4 text-xs leading-relaxed text-slate-500">
        {LEGAL_DISCLAIMER}
      </p>
    </div>
  );
}
