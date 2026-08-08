'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export type AuthFormState = { error?: string; notice?: string };

const emailSchema = z.string().trim().toLowerCase().email('כתובת האימייל אינה תקינה');

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, 'יש להזין שם מלא'),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{1,2}-?\d{7}$/, 'מספר טלפון לא תקין. לדוגמה: 050-1234567'),
  email: emailSchema,
  password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים'),
});

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'יש להזין סיסמה'),
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'יש להזין שם מלא'),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{1,2}-?\d{7}$/, 'מספר טלפון לא תקין. לדוגמה: 050-1234567'),
});

/** הרשמה עם אימייל וסיסמה. Supabase שולח מייל אימות. */
export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'כתובת האימייל הזו כבר רשומה. אפשר להתחבר איתה.' };
    }
    return { error: 'ההרשמה נכשלה. אפשר לנסות שוב בעוד רגע.' };
  }

  // כשאימות האימייל פעיל, Supabase לא מחזיר סשן עד שלוחצים על הקישור במייל.
  if (!data.session) {
    return {
      notice:
        'שלחנו לך מייל אימות. צריך ללחוץ על הקישור שבמייל כדי להפעיל את החשבון, ואז להתחבר.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/account');
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'החשבון עדיין לא אומת. צריך ללחוץ על הקישור שנשלח לאימייל.' };
    }
    return { error: 'האימייל או הסיסמה שגויים.' };
  }

  const redirectTo = String(formData.get('redirect') ?? '') || '/matches';
  revalidatePath('/', 'layout');
  redirect(redirectTo.startsWith('/') ? redirectTo : '/matches');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

/** עדכון שם וטלפון באזור האישי. */
export async function updateProfile(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'צריך להתחבר מחדש.' };

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone })
    .eq('id', user.id);

  if (error) return { error: 'לא הצלחנו לשמור את הפרטים. אפשר לנסות שוב.' };

  revalidatePath('/account');
  return { notice: 'הפרטים נשמרו.' };
}
