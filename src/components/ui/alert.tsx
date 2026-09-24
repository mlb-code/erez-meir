import { cx } from './cx';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

const TONES: Record<AlertTone, { box: string; icon: string }> = {
  info: { box: 'border-brand-200 bg-brand-50 text-brand-900', icon: 'text-brand-600' },
  success: { box: 'border-success-200 bg-success-50 text-success-900', icon: 'text-success-600' },
  warning: { box: 'border-warning-200 bg-warning-50 text-warning-900', icon: 'text-warning-700' },
  error: { box: 'border-danger-200 bg-danger-50 text-danger-900', icon: 'text-danger-600' },
};

/** לכל מצב יש גם צורה, לא רק צבע — כדי שההודעה תיקרא גם בעיוורון צבעים ובהדפסה. */
function AlertIcon({ tone, className }: { tone: AlertTone; className: string }) {
  const shared = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className,
  };

  if (tone === 'success') {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.4l2.7 2.6L16 9.6" />
      </svg>
    );
  }
  if (tone === 'warning') {
    return (
      <svg {...shared}>
        <path d="M12 4.2 2.9 19.8h18.2z" />
        <path d="M12 10v4.1" />
        <path d="M12 17.1v.6" />
      </svg>
    );
  }
  if (tone === 'error') {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.4v5.3" />
        <path d="M12 16.1v.6" />
      </svg>
    );
  }
  return (
    <svg {...shared}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11.2v5.1" />
      <path d="M12 7.6v.6" />
    </svg>
  );
}

export function Alert({
  tone = 'info',
  title,
  className,
  children,
}: {
  tone?: AlertTone;
  title?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const style = TONES[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx('flex gap-3 rounded-card border px-4 py-3', style.box, className)}
    >
      <AlertIcon tone={tone} className={cx('mt-0.5 h-5 w-5 shrink-0', style.icon)} />
      <div className="min-w-0 flex-1 text-caption leading-relaxed">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={cx(title && 'mt-1')}>{children}</div>}
      </div>
    </div>
  );
}

/**
 * הקיצור שמופיע בראש כל טופס: שגיאה מהשרת, או הודעה נייטרלית.
 * מחזיר null כשאין מה להציג, כדי שלא יישאר רווח ריק בטופס.
 */
export function FormAlert({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;
  return <Alert tone={error ? 'error' : 'info'}>{error ?? notice}</Alert>;
}
