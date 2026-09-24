import Link from 'next/link';
import { LogoLockup } from '@/components/logo';
import { NavMenu, type NavLink } from '@/components/nav-menu';
import { Button, ButtonLink } from '@/components/ui';
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
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-gutter">
        <Link href="/" className="rounded-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
          <LogoLockup />
        </Link>

        <div className="flex-1" />

        <NavMenu links={links}>
          {user ? (
            <div className="flex items-center gap-2">
              <ButtonLink href="/new" size="sm">
                פרסום מודעה
              </ButtonLink>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">
                  התנתקות
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ButtonLink href="/login" variant="ghost" size="sm">
                התחברות
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                הרשמה
              </ButtonLink>
            </div>
          )}
        </NavMenu>
      </div>
    </header>
  );
}
