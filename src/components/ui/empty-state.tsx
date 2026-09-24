import { cx } from './cx';

/**
 * מצב ריק אחיד. שלושת החלקים — מה אין, למה, ומה לעשות עכשיו —
 * כדי שמסך ריק יהיה הסבר ולא מבוי סתום.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex flex-col items-center rounded-card border border-dashed border-line-strong bg-surface px-5 py-10 text-center',
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-pill bg-ink-100 text-ink-400">
        {icon ?? (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 10.5 12 4l8 6.5" />
            <path d="M6 10v9h12v-9" />
          </svg>
        )}
      </span>
      <p className="text-heading text-ink-900">{title}</p>
      {description && (
        <p className="mt-2 max-w-md text-caption leading-relaxed text-ink-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
