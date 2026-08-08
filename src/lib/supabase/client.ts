import { createBrowserClient } from '@supabase/ssr';

/** לקוח Supabase לשימוש בקומפוננטות שרצות בדפדפן ('use client'). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
