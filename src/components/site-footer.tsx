import Link from 'next/link';
import { LogoLockup } from '@/components/logo';
import { LEGAL_DISCLAIMER } from '@/lib/constants';

const LINKS = [
  { href: '/listings', label: 'לוח ההחלפות' },
  { href: '/#how-it-works', label: 'איך זה עובד' },
  { href: '/new', label: 'פרסום מודעה' },
  { href: '/documents/terms', label: 'תנאי השירות' },
  { href: '/documents/privacy', label: 'מדיניות הפרטיות' },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-5xl px-gutter py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <LogoLockup markClassName="h-8 w-8 text-brand-600" />
            <p className="mt-3 text-caption leading-relaxed text-ink-500">{LEGAL_DISCLAIMER}</p>
          </div>

          <nav className="flex flex-col gap-2 text-caption">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-ink-600 hover:text-brand-700">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 border-t border-ink-100 pt-6 text-xs text-ink-400">
          חליפין — פלטפורמת החלפת דירות. גרסת הדגמה.
        </p>
      </div>
    </footer>
  );
}
