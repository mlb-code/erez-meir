import Link from 'next/link';
import { cx } from './cx';

/**
 * ראש עמוד אחיד: קישור חזרה, כותרת, משפט הסבר ופעולה.
 * החץ פונה ימינה — בעברית זה הכיוון "אחורה".
 */
export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <header className={cx('flex flex-col gap-4', className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1 text-caption font-semibold text-brand-700 hover:text-brand-800 hover:underline"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 5l5 5-5 5" />
          </svg>
          {backLabel ?? 'חזרה'}
        </Link>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-title text-ink-900">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-body leading-relaxed text-ink-600">{description}</p>
          )}
        </div>
        {actions}
      </div>
    </header>
  );
}
