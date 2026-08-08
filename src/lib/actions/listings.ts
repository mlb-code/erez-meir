'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { CITIES } from '@/lib/constants';
import { runMatching } from '@/lib/actions/matching';
import { createClient } from '@/lib/supabase/server';

export type ListingFormState = { error?: string; notice?: string };

const CITY_VALUES = CITIES as unknown as [string, ...string[]];

/** שדה מספרי לא חובה — מחרוזת ריקה נחשבת "לא הוזן". */
const optionalNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : Number(value)))
    .refine(
      (value) => value === null || (Number.isFinite(value) && value >= min && value <= max),
      { message: `הערך חייב להיות בין ${min} ל-${max}` },
    );

const detailsSchema = z.object({
  city: z.enum(CITY_VALUES, { message: 'יש לבחור עיר' }),
  neighborhood: z.string().trim().max(80).transform((value) => value || null),
  street: z.string().trim().max(80).transform((value) => value || null),
  rooms: z.coerce.number().min(1, 'יש לבחור מספר חדרים').max(20),
  size_sqm: z.coerce.number().int().min(15, 'שטח לא סביר').max(1000, 'שטח לא סביר'),
  floor: optionalNumber(-2, 80),
  total_floors: optionalNumber(1, 80),
  building_year: optionalNumber(1900, new Date().getFullYear() + 5),
  condition: z.enum(['new', 'renovated', 'maintained', 'needs_renovation', 'pre_urban_renewal']),
  urban_renewal_status: z.enum([
    'none',
    'tama38_planned',
    'tama38_approved',
    'pinui_binui_planned',
    'pinui_binui_approved',
  ]),
});

const valueSchema = z.object({
  asking_value: z.coerce
    .number()
    .int()
    .min(100_000, 'השווי המבוקש נמוך מדי')
    .max(100_000_000, 'השווי המבוקש גבוה מדי'),
  description: z.string().trim().max(2000).transform((value) => value || null),
});

const wantedSchema = z.object({
  wanted_min_rooms: optionalNumber(1, 20),
  wanted_max_rooms: optionalNumber(1, 20),
  wanted_min_sqm: optionalNumber(15, 1000),
  cash_add_max: z.coerce.number().int().min(0).max(50_000_000),
  cash_receive_min: z.coerce.number().int().min(0).max(50_000_000),
});

const checkbox = (formData: FormData, name: string) => formData.get(name) === 'on';

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
    .select('id, owner_id, status')
    .eq('id', listingId)
    .maybeSingle();

  if (!data || data.owner_id !== user.id) redirect('/account');
  return { supabase, user, listing: data };
}

// ---------------------------------------------------------------------------
//  צעד 1 — פרטי הדירה
// ---------------------------------------------------------------------------

export async function saveDetails(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const parsed = detailsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await requireUser();
  const listingId = String(formData.get('listing_id') ?? '');

  const values = {
    ...parsed.data,
    has_elevator: checkbox(formData, 'has_elevator'),
    has_parking: checkbox(formData, 'has_parking'),
    has_balcony: checkbox(formData, 'has_balcony'),
    has_safe_room: checkbox(formData, 'has_safe_room'),
  };

  let id = listingId;

  if (id) {
    const { error } = await supabase
      .from('listings')
      .update(values)
      .eq('id', id)
      .eq('owner_id', user.id);
    if (error) return { error: 'לא הצלחנו לשמור את פרטי הדירה.' };
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
//  צעד 3 — שווי מבוקש ותיאור
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
  if (error) return { error: 'לא הצלחנו לשמור את השווי המבוקש.' };

  redirect(`/new?id=${listingId}&step=4`);
}

// ---------------------------------------------------------------------------
//  צעד 4 — מה אני מחפש, גמישות מזומן, ופרסום
// ---------------------------------------------------------------------------

export async function saveWantedAndPublish(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const parsed = wantedSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const wantedCities = formData.getAll('wanted_cities').map(String).filter(Boolean);
  if (!wantedCities.length) {
    return { error: 'יש לבחור לפחות אזור אחד שבו תרצה לקבל דירה.' };
  }

  const { wanted_min_rooms: min, wanted_max_rooms: max } = parsed.data;
  if (min !== null && max !== null && min > max) {
    return { error: 'מספר החדרים המינימלי גדול מהמקסימלי.' };
  }

  const mustHaves = formData.getAll('must_haves').map(String).filter(Boolean);
  const listingId = String(formData.get('listing_id') ?? '');
  const { supabase, listing } = await requireOwnListing(listingId);

  const { error } = await supabase
    .from('listings')
    .update({
      ...parsed.data,
      wanted_cities: wantedCities,
      must_haves: mustHaves,
      status: listing.status === 'draft' ? 'active' : listing.status,
    })
    .eq('id', listingId);

  if (error) {
    return { error: 'לא הצלחנו לפרסם את המודעה. צריך לוודא שכל הצעדים הקודמים הושלמו.' };
  }

  // מיד עם הפרסום — מחפשים התאמות ומעגלים.
  await runMatching();

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
