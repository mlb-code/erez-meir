import { createClient } from '@/lib/supabase/server';
import type { ListingWithPhotos } from '@/lib/types';

const LISTING_SELECT = '*, listing_photos(id, listing_id, storage_path, sort_order)';

export interface BoardFilters {
  city?: string;
  minRooms?: number;
  maxRooms?: number;
  minValue?: number;
  maxValue?: number;
  wantedCity?: string;
}

/** מודעות פעילות ללוח החיפוש. */
export async function getActiveListings(
  filters: BoardFilters = {},
  limit = 60,
): Promise<ListingWithPhotos[]> {
  const supabase = await createClient();
  let query = supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters.city) query = query.eq('city', filters.city);
  if (filters.minRooms !== undefined) query = query.gte('rooms', filters.minRooms);
  if (filters.maxRooms !== undefined) query = query.lte('rooms', filters.maxRooms);
  if (filters.minValue !== undefined) query = query.gte('asking_value', filters.minValue);
  if (filters.maxValue !== undefined) query = query.lte('asking_value', filters.maxValue);
  if (filters.wantedCity) query = query.contains('wanted_cities', [filters.wantedCity]);

  const { data, error } = await query;
  if (error) throw error;

  return sortPhotos((data ?? []) as unknown as ListingWithPhotos[]);
}

export async function getListingById(id: string): Promise<ListingWithPhotos | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return sortPhotos([data as unknown as ListingWithPhotos])[0];
}

/** כל המודעות של המשתמש המחובר, בכל סטטוס. */
export async function getMyListings(userId: string): Promise<ListingWithPhotos[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return sortPhotos((data ?? []) as unknown as ListingWithPhotos[]);
}

function sortPhotos(listings: ListingWithPhotos[]): ListingWithPhotos[] {
  for (const listing of listings) {
    listing.listing_photos = (listing.listing_photos ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    );
  }
  return listings;
}
