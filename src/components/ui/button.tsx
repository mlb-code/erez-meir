import Link from 'next/link';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  secondary:
    'border border-line-strong bg-surface text-ink-700 hover:border-ink-400 hover:bg-ink-50 active:bg-ink-100',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200',
  danger: 'bg-danger-700 text-white hover:bg-danger-800 active:bg-danger-900',
};

/** גובה קבוע לכל גודל — כפתור וסלקט באותה שורה יוצאים מיושרים. */
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3.5 text-caption',
  md: 'h-11 gap-2 px-5 text-caption',
  lg: 'h-13 gap-2 px-6 text-body',
};

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: ButtonStyleProps = {}): string {
  return cx(
    'inline-flex shrink-0 items-center justify-center rounded-field font-semibold',
    'transition-colors select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 animate-spin">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type ButtonProps = ButtonStyleProps &
  Omit<React.ComponentProps<'button'>, 'className'> & {
    className?: string;
    /** מצב טעינה: מציג מחוון, מנטרל לחיצה, ומחליף את הטקסט ב-loadingLabel אם ניתן. */
    loading?: boolean;
    loadingLabel?: string;
  };

export function Button({
  variant,
  size,
  fullWidth,
  className,
  loading = false,
  loadingLabel,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClasses({ variant, size, fullWidth }), className)}
    >
      {loading && <Spinner />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

export type ButtonLinkProps = ButtonStyleProps &
  Omit<React.ComponentProps<typeof Link>, 'className'> & { className?: string };

/** אותו מראה בדיוק, אבל ניווט — כך שקישור "לפרסום מודעה" וכפתור שליחה נראים זהים. */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link {...props} className={cx(buttonClasses({ variant, size, fullWidth }), className)}>
      {children}
    </Link>
  );
}
