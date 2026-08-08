import Link from 'next/link';
import { Logo } from '@/components/logo';
import { NavMenu, type NavLink } from '@/components/nav-menu';
import { signOut } from '@/lib/actions/auth';
import { countPendingMatches } from '@/lib/data/matches';
import { getCurrentUser } from '@/lib/supabase/server';

export async function SiteHeader() {
  const user = await getCurrentUser();
  const pending = user ? await countPendingMatches(user.id) : 0;

  const links: NavLink[] = user
    ? [
        { href: '/listings', label: 'לוח ההחלפות' },
        { href: '/matches', label: 'ההתאמות שלי', badge: pending || undefined },
        { href: '/account', label: 'האזור האישי' },
      ]
    : [
        { href: '/listings', label: 'לוח ההחלפות' },
        { href: '/#how-it-works', label: 'איך זה עובד' },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">החלפה</span>
        </Link>

        <div className="flex-1" />

        <NavMenu links={links}>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/new"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                פרסום מודעה
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                >
                  התנתקות
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                התחברות
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                הרשמה
              </Link>
            </div>
          )}
        </NavMenu>
      </div>
    </header>
  );
}
