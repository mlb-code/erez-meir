'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface NavLink {
  href: string;
  label: string;
  badge?: number;
}

export function NavMenu({
  links,
  children,
}: {
  links: NavLink[];
  /** אזור הפעולות (התחברות / התנתקות) — נבנה בשרת ומוזרק פנימה. */
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* תפריט למסך רחב */}
      <nav className="hidden items-center gap-1 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(link.href)
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {link.label}
            {!!link.badge && (
              <span className="num absolute -top-1 -left-1 min-w-5 rounded-full bg-chain-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="hidden md:block">{children}</div>

      {/* כפתור תפריט למובייל */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'סגירת התפריט' : 'פתיחת התפריט'}
        className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          )}
        </svg>
        {!open && links.some((link) => link.badge) && (
          <span className="absolute top-1 left-1 h-2.5 w-2.5 rounded-full bg-chain-500" />
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-slate-200 bg-white shadow-lg md:hidden">
          <nav className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium ${
                  isActive(link.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-700'
                }`}
              >
                {link.label}
                {!!link.badge && (
                  <span className="num rounded-full bg-chain-500 px-2 py-0.5 text-xs font-bold text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="mt-2 border-t border-slate-100 pt-3">{children}</div>
          </nav>
        </div>
      )}
    </>
  );
}
