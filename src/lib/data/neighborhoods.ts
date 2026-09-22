import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Neighborhood } from '@/lib/types';

/**
 * שכונות — רשימה סגורה לכל עיר (SPEC §4.3, §5.4).
 * המקור היחיד הוא הטבלה public.neighborhoods (seed במיגרציה 005).
 * הטבלה פתוחה לקריאה לכולם (RLS), לכן אין צורך במשתמש מחובר.
 */

const NEIGHBORHOOD_SELECT = 'id, city, name, sort_order';

/** כל השכונות של עיר אחת, לפי סדר התצוגה. עיר שאינה מוכרת מחזירה מערך ריק. */
export const getNeighborhoods = cache(async (city: string): Promise<Neighborhood[]> => {
  const trimmed = city.trim();
  if (!trimmed) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('neighborhoods')
    .select(NEIGHBORHOOD_SELECT)
    .eq('city', trimmed)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Neighborhood[];
});

/** כל השכונות בכל הערים, ממופות לפי עיר — לאשף הפרסום ("מה אני מחפש": כמה ערים בבת אחת). */
export const getNeighborhoodsByCity = cache(async (): Promise<Record<string, Neighborhood[]>> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('neighborhoods')
    .select(NEIGHBORHOOD_SELECT)
    .order('city', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;

  const byCity: Record<string, Neighborhood[]> = {};
  for (const row of (data ?? []) as Neighborhood[]) {
    (byCity[row.city] ??= []).push(row);
  }
  return byCity;
});

/** שכונות לפי מזהים — להצגת wanted_neighborhood_ids ו-neighborhood_id של מודעה. */
export async function getNeighborhoodsByIds(ids: readonly string[]): Promise<Neighborhood[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('neighborhoods')
    .select(NEIGHBORHOOD_SELECT)
    .in('id', unique)
    .order('city', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Neighborhood[];
}

/** שכונה אחת לפי מזהה, או null. */
export async function getNeighborhoodById(id: string): Promise<Neighborhood | null> {
  if (!id) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('neighborhoods')
    .select(NEIGHBORHOOD_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as Neighborhood | null) ?? null;
}
