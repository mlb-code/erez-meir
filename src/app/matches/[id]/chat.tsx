'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { sendMessage } from '@/lib/actions/matches';
import { formatMessageTime } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/lib/types';

/** ל-MVP מספיק לרענן כל 5 שניות. TODO (הרחבה עתידית): מעבר ל-realtime. */
const POLL_MS = 5000;

export function Chat({
  matchId,
  currentUserId,
  names,
  initialMessages,
}: {
  matchId: string;
  currentUserId: string;
  names: Record<string, string>;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('messages')
      .select('id, match_id, sender_id, body, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
  }, [matchId]);

  useEffect(() => {
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function handleSubmit(formData: FormData) {
    const body = String(formData.get('body') ?? '').trim();
    if (!body) return;
    setSending(true);
    await sendMessage(formData);
    formRef.current?.reset();
    await load();
    setSending(false);
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white">
      <div className="flex max-h-[60vh] min-h-64 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="my-auto text-center text-sm text-slate-400">
            עוד לא נכתבו הודעות. אפשר לפתוח ולהציע זמן לסיבוב בדירות.
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === currentUserId;
            return (
              <div key={message.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isMine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs font-bold text-slate-500">
                      {names[message.sender_id] ?? 'משתתף'}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.body}</p>
                  <p
                    className={`num mt-1 text-[11px] ${isMine ? 'text-brand-100' : 'text-slate-400'}`}
                  >
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        ref={formRef}
        action={handleSubmit}
        className="flex items-end gap-2 border-t border-slate-100 p-3"
      >
        <input type="hidden" name="match_id" value={matchId} />
        <input
          name="body"
          required
          maxLength={2000}
          autoComplete="off"
          placeholder="כתיבת הודעה…"
          className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
        >
          {sending ? '…' : 'שליחה'}
        </button>
      </form>
    </div>
  );
}
