import Link from 'next/link';
import { Logo } from '@/components/logo';
import { LEGAL_DISCLAIMER } from '@/lib/constants';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <Logo className="h-8 w-8" />
              <span className="text-base font-extrabold text-slate-900">החלפה</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{LEGAL_DISCLAIMER}</p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/listings" className="text-slate-600 hover:text-brand-700">
              לוח ההחלפות
            </Link>
            <Link href="/#how-it-works" className="text-slate-600 hover:text-brand-700">
              איך זה עובד
            </Link>
            <Link href="/new" className="text-slate-600 hover:text-brand-700">
              פרסום מודעה
            </Link>
          </nav>
        </div>

        <p className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-400">
          החלפה — פלטפורמת החלפת דירות. גרסת הדגמה.
        </p>
      </div>
    </footer>
  );
}
