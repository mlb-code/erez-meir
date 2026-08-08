import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * לקוח Supabase לצד השרת (Server Components, Server Actions, Route Handlers).
 * מקריא וכותב את קובצי העוגיות של הסשן.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // קריאה מתוך Server Component — רענון העוגיות נעשה ב-middleware.
          }
        },
      },
    },
  );
}

/** מחזיר את המשתמש המחובר, או null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
