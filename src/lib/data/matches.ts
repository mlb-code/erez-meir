import { createClient } from '@/lib/supabase/server';
import { cashGapBetween } from '@/lib/matching/engine';
import type {
  ListingWithPhotos,
  MatchStatus,
  MatchType,
  ResponseType,
} from '@/lib/types';

export interface MatchStep {
  /** מי עובר */
  from: ListingWithPhotos;
  /** לאיזו דירה הוא עובר */
  to: ListingWithPhotos;
  /** חיובי = `from` משלים כסף. שלילי = `from` מקבל כסף. */
  cash: number;
}

export interface MatchParticipant {
  listing: ListingWithPhotos;
  isMe: boolean;
  response: ResponseType | null;
  /** שם ופרטי קשר נחשפים רק אחרי שכל הצדדים אישרו. */
  ownerName: string | null;
  ownerPhone: string | null;
}

export interface EnrichedMatch {
  id: string;
  match_type: MatchType;
  status: MatchStatus;
  score: number;
  created_at: string;
  /** בסדר המעבר, מסובב כך שהמודעה שלי ראשונה. */
  participants: MatchParticipant[];
  steps: MatchStep[];
  myListingId: string;
  myResponse: ResponseType | null;
  interestedCount: number;
  totalCount: number;
}

/**
 * מחזיר את כל ההתאמות של המשתמש המחובר, מועשרות בפרטי המודעות,
 * בתגובות ובתנועות הכסף. ה-RLS כבר מגביל את השאילתה למעגלים שאני משתתף בהם.
 */
export async function getMyMatches(userId: string): Promise<EnrichedMatch[]> {
  const supabase = await createClient();

  const { data: matchRows, error: matchError } = await supabase
    .from('matches')
    .select('id, match_type, chain_listing_ids, score, status, created_at')
    .order('score', { ascending: false });

  if (matchError) throw matchError;
  if (!matchRows?.length) return [];

  const listingIds = [...new Set(matchRows.flatMap((m) => m.chain_listing_ids as string[]))];
  const matchIds = matchRows.map((m) => m.id);

  const [{ data: listingRows }, { data: responseRows }] = await Promise.all([
    supabase
      .from('listings')
      .select('*, listing_photos(id, listing_id, storage_path, sort_order)')
      .in('id', listingIds),
    supabase
      .from('match_responses')
      .select('match_id, listing_id, response')
      .in('match_id', matchIds),
  ]);

  const listings = new Map<string, ListingWithPhotos>();
  for (const row of (listingRows ?? []) as unknown as ListingWithPhotos[]) {
    row.listing_photos = (row.listing_photos ?? []).sort((a, b) => a.sort_order - b.sort_order);
    listings.set(row.id, row);
  }

  // פרופילים — מוחזרים רק עבור התאמות שכל הצדדים אישרו (מדיניות RLS).
  const ownerIds = [...new Set([...listings.values()].map((l) => l.owner_id))];
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', ownerIds);
  const profiles = new Map((profileRows ?? []).map((p) => [p.id, p]));

  const responses = new Map<string, ResponseType>();
  for (const row of responseRows ?? []) {
    responses.set(`${row.match_id}:${row.listing_id}`, row.response as ResponseType);
  }

  const enriched: EnrichedMatch[] = [];

  for (const match of matchRows) {
    const chain = match.chain_listing_ids as string[];
    // אם מודעה כלשהי במעגל נמחקה, ההתאמה כבר לא ניתנת להצגה.
    if (chain.some((id) => !listings.has(id))) continue;

    const myIndex = chain.findIndex((id) => listings.get(id)!.owner_id === userId);
    if (myIndex === -1) continue;

    // סיבוב המעגל כך שאני ראשון — "אתה עובר לדירה של…"
    const ordered = [...chain.slice(myIndex), ...chain.slice(0, myIndex)];

    const participants: MatchParticipant[] = ordered.map((id) => {
      const listing = listings.get(id)!;
      const profile = profiles.get(listing.owner_id);
      return {
        listing,
        isMe: listing.owner_id === userId,
        response: responses.get(`${match.id}:${id}`) ?? null,
        ownerName: profile?.full_name ?? null,
        ownerPhone: profile?.phone ?? null,
      };
    });

    const steps: MatchStep[] = ordered.map((id, index) => {
      const from = listings.get(id)!;
      const to = listings.get(ordered[(index + 1) % ordered.length])!;
      // מודעות במעגל הן תמיד פעילות, ולכן תמיד עם שווי.
      return { from, to, cash: cashGapBetween(from.asking_value ?? 0, to.asking_value ?? 0) };
    });

    enriched.push({
      id: match.id,
      match_type: match.match_type as MatchType,
      status: match.status as MatchStatus,
      score: match.score,
      created_at: match.created_at,
      participants,
      steps,
      myListingId: ordered[0],
      myResponse: responses.get(`${match.id}:${ordered[0]}`) ?? null,
      interestedCount: participants.filter((p) => p.response === 'interested').length,
      totalCount: participants.length,
    });
  }

  return enriched;
}

export async function getMatchById(
  userId: string,
  matchId: string,
): Promise<EnrichedMatch | null> {
  const all = await getMyMatches(userId);
  return all.find((match) => match.id === matchId) ?? null;
}

/**
 * כמה התאמות מחכות לתגובה שלי — לתג שמופיע בתפריט.
 * גרסה קלה במכוון: רצה בכל טעינת עמוד, ולכן לא מושכת את פרטי המודעות.
 */
export async function countPendingMatches(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data: myListings } = await supabase
    .from('listings')
    .select('id')
    .eq('owner_id', userId);

  const myListingIds = (myListings ?? []).map((l) => l.id);
  if (!myListingIds.length) return 0;

  const [{ data: matchRows }, { data: responseRows }] = await Promise.all([
    supabase.from('matches').select('id, chain_listing_ids').neq('status', 'dismissed'),
    supabase.from('match_responses').select('match_id').in('listing_id', myListingIds),
  ]);

  const answered = new Set((responseRows ?? []).map((r) => r.match_id));
  return (matchRows ?? []).filter((m) => !answered.has(m.id)).length;
}
