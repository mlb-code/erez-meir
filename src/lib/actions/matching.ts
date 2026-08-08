'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { computeMatches, type MatchableListing } from '@/lib/matching/engine';
import { createClient } from '@/lib/supabase/server';

const ENGINE_FIELDS =
  'id, city, rooms, size_sqm, asking_value, has_elevator, has_parking, has_balcony, ' +
  'has_safe_room, condition, wanted_cities, wanted_min_rooms, wanted_max_rooms, ' +
  'wanted_min_sqm, must_haves, cash_add_max, cash_receive_min';

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
    .select(ENGINE_FIELDS)
    .eq('status', 'active');

  if (error) throw error;

  const listings = (data ?? []) as unknown as MatchableListing[];
  const matches = computeMatches(listings);

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
