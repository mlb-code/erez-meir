'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { runMatching } from '@/lib/actions/matching';
import { getNeighborhoodsByIds } from '@/lib/data/neighborhoods';
import { parseDetailsForm, parseWantedForm, valueSchema } from '@/lib/listing-form';
import { createClient } from '@/lib/supabase/server';

export type ListingFormState = { error?: string; notice?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/new');
  return { supabase, user };
}

/** מוודא שהמודעה שייכת למשתמש. מחזיר את המודעה. */
async function requireOwnListing(listingId: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from('listings')
    .select('id, owner_id, status, ownership_status, asking_value')
    .eq('id', listingId)
    .maybeSingle();

  if (!data || data.owner_id !== user.id) redirect('/account');
  return { supabase, user, listing: data };
}

// ---------------------------------------------------------------------------
//  צעד 1 — "מה יש לי"
// ---------------------------------------------------------------------------

export async function saveDetails(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const parsed = parseDetailsForm(formData);
  if ('error' in parsed) return { error: parsed.error };

  const values = parsed.values;

  // שם השכונה נשמר גם כטקסט, לתאימות עם המודעות והמסכים הקיימים.
  const neighborhoodId = values.neighborhood_id as string | null;
  if (neighborhoodId) {
    const [neighborhood] = await getNeighborhoodsByIds([neighborhoodId]);
    if (!neighborhood || neighborhood.city !== values.city) {
      return { error: 'השכונה שנבחרה אינה שייכת לעיר שנבחרה.' };
    }
    values.neighborhood = neighborhood.name;
  } else {
    values.neighborhood = null;
  }

  const { supabase, user } = await requireUser();
  const listingId = String(formData.get('listing_id') ?? '');

  let id = listingId;

  if (id) {
    const { error } = await supabase
      .from('listings')
      .update(values)
      .eq('id', id)
      .eq('owner_id', user.id);
    if (error) return { error: 'לא הצלחנו לשמור את פרטי הנכס.' };
  } else {
    const { data, error } = await supabase
      .from('listings')
      .insert({ ...values, owner_id: user.id, status: 'draft' })
      .select('id')
      .single();
    if (error || !data) return { error: 'לא הצלחנו ליצור את המודעה.' };
    id = data.id;
  }

  revalidatePath('/account');
  redirect(`/new?id=${id}&step=2`);
}

// ---------------------------------------------------------------------------
//  צעד 3 — שווי מוצהר ותיאור
// ---------------------------------------------------------------------------

export async function saveValue(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const parsed = valueSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const listingId = String(formData.get('listing_id') ?? '');
  const { supabase } = await requireOwnListing(listingId);

  const { error } = await supabase.from('listings').update(parsed.data).eq('id', listingId);
  if (error) return { error: 'לא הצלחנו לשמור את השווי המוצהר.' };

  redirect(`/new?id=${listingId}&step=4`);
}

// ---------------------------------------------------------------------------
//  צעד 4 — "מה אני מחפש", גמישות מזומן, ופרסום
// ---------------------------------------------------------------------------

export async function saveWantedAndPublish(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const parsed = parseWantedForm(formData);
  if ('error' in parsed) return { error: parsed.error };

  const values = parsed.values;

  // שכונות מבוקשות — רק כאלה שקיימות ושייכות לאחת הערים שנבחרו. ריק = כל העיר.
  const neighborhoods = await getNeighborhoodsByIds(values.wanted_neighborhood_ids);
  const wantedNeighborhoodIds = neighborhoods
    .filter((neighborhood) => values.wanted_cities.includes(neighborhood.city))
    .map((neighborhood) => neighborhood.id);

  const listingId = String(formData.get('listing_id') ?? '');
  const { supabase, listing } = await requireOwnListing(listingId);

  if (listing.status === 'draft' && listing.asking_value === null) {
    return { error: 'לפני הפרסום צריך להשלים את השווי המוצהר בצעד הקודם.' };
  }

  // פרסום ראשון: המודעה ממתינה לאימות בעלות (§4.2). היא לא עולה לאוויר
  // ולא נכנסת למנוע עד שמנהל התפעול יאשר את הנסח (חבילה C2).
  const publishing = listing.status === 'draft';
  const ownershipApproved = listing.ownership_status === 'approved';
  const nextStatus = publishing ? (ownershipApproved ? 'active' : 'pending_ownership') : listing.status;

  const { error } = await supabase
    .from('listings')
    .update({
      ...values,
      wanted_neighborhood_ids: wantedNeighborhoodIds,
      status: nextStatus,
      ...(publishing && !ownershipApproved ? { ownership_status: 'pending' } : {}),
    })
    .eq('id', listingId);

  if (error) {
    return { error: 'לא הצלחנו לשמור את המודעה. צריך לוודא שכל הצעדים הקודמים הושלמו.' };
  }

  // המנוע רץ על מודעות פעילות בלבד — מודעה שממתינה לאימות בעלות לא נכנסת אליו.
  if (nextStatus === 'active') await runMatching();

  revalidatePath('/account');
  revalidatePath('/listings');
  redirect(`/new/done?id=${listingId}`);
}

// ---------------------------------------------------------------------------
//  ניהול המודעה מהאזור האישי
// ---------------------------------------------------------------------------

export async function setListingStatus(formData: FormData) {
  const listingId = String(formData.get('listing_id') ?? '');
  const status = String(formData.get('status') ?? '');
  const allowed = ['active', 'in_negotiation', 'swapped', 'archived'];
  if (!allowed.includes(status)) redirect('/account');

  const { supabase } = await requireOwnListing(listingId);
  await supabase.from('listings').update({ status }).eq('id', listingId);

  if (status === 'active') await runMatching();

  revalidatePath('/account');
  revalidatePath('/listings');
  redirect('/account');
}

export async function deleteListing(formData: FormData) {
  const listingId = String(formData.get('listing_id') ?? '');
  const { supabase } = await requireOwnListing(listingId);

  await supabase.from('listings').delete().eq('id', listingId);

  revalidatePath('/account');
  revalidatePath('/listings');
  redirect('/account');
}
