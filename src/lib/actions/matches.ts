'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const responseSchema = z.object({
  match_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  response: z.enum(['interested', 'not_interested']),
});

/**
 * תגובת משתתף להתאמה. טריגר בבסיס הנתונים מעדכן בעקבותיה את סטטוס
 * ההתאמה — וכשכולם סימנו "מעוניין", נפתח הצ'אט הקבוצתי.
 */
export async function respondToMatch(formData: FormData) {
  const parsed = responseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from('match_responses')
    .upsert(
      {
        match_id: parsed.data.match_id,
        listing_id: parsed.data.listing_id,
        response: parsed.data.response,
        responded_at: new Date().toISOString(),
      },
      { onConflict: 'match_id,listing_id' },
    );

  revalidatePath('/matches');
  revalidatePath(`/matches/${parsed.data.match_id}`);
}

const messageSchema = z.object({
  match_id: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

/** שליחת הודעה בצ'אט של התאמה. ה-RLS חוסם שליחה לפני שכל הצדדים אישרו. */
export async function sendMessage(formData: FormData): Promise<void> {
  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('messages').insert({
    match_id: parsed.data.match_id,
    sender_id: user.id,
    body: parsed.data.body,
  });

  revalidatePath(`/matches/${parsed.data.match_id}`);
}
