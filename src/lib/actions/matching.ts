'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ENGINE_LISTING_SELECT } from '@/lib/constants';
import { computeMatches, type MatchableListing } from '@/lib/matching/engine';
import { MATCHING_CONFIG } from '@/lib/matching/config';
import { createClient } from '@/lib/supabase/server';

/**
 * מריץ את מנוע ההתאמות על כל המודעות הפעילות ושומר את המעגלים שנמצאו.
 * נקרא אחרי פרסום או עדכון של מודעה, ומתוך מסך ההתאמות.
 *
 * TODO (הרחבה עתידית): להריץ ברקע במקום בתוך הבקשה, ולשלוח התראה
 *                       למשתתפים במעגל חדש.
 */
export async function runMatching(): Promise<{ found: number; saved: number }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('listings')
    .select(ENGINE_LISTING_SELECT)
    .eq('status', 'active');

  if (error) throw error;

  const listings = (data ?? []) as unknown as MatchableListing[];
  // מדיניות שלב 1: מציגים ישיר ומשולש בלבד (הנחה ה3). המנוע יודע עד 5.
  const matches = computeMatches(listings, MATCHING_CONFIG.MAX_CHAIN_LENGTH_SHOWN);

  if (!matches.length) return { found: 0, saved: 0 };

  const { data: saved, error: saveError } = await supabase.rpc('save_matches', {
    p_matches: matches,
  });

  if (saveError) throw saveError;

  revalidatePath('/matches');
  return { found: matches.length, saved: (saved as number) ?? 0 };
}

/** גרסה לשימוש כ-form action ("חיפוש התאמות מחדש"). */
export async function refreshMatches(): Promise<void> {
  await runMatching();
}

/**
 * מופעל מכפתור "יש לי דירה שמתאימה" בדף מודעה:
 * מריץ את המנוע ומעביר למסך ההתאמות, מסונן על המודעה הזו.
 */
export async function findMatchWith(formData: FormData) {
  const listingId = String(formData.get('listing_id') ?? '');
  await runMatching();
  redirect(`/matches?with=${encodeURIComponent(listingId)}`);
}
