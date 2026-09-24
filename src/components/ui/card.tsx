import { cx } from './cx';

export type CardTone = 'default' | 'brand' | 'muted' | 'outline';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const TONES: Record<CardTone, string> = {
  default: 'border border-line bg-surface shadow-card',
  brand: 'border border-brand-200 bg-brand-50',
  muted: 'border border-line bg-ink-50',
  outline: 'border border-dashed border-line-strong bg-surface',
};

const PADDINGS: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export interface CardProps {
  tone?: CardTone;
  padding?: CardPadding;
  /** כותרת המקטע. כשהיא קיימת נוצרת שורת כותרת עם מקום לפעולה בצד. */
  title?: string;
  /** פעולה בצד הכותרת — כפתור או קישור. */
  action?: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
  children?: React.ReactNode;
}

export function Card({
  tone = 'default',
  padding = 'md',
  title,
  action,
  className,
  as: Tag = 'div',
  children,
}: CardProps) {
  return (
    <Tag className={cx('rounded-card', TONES[tone], PADDINGS[padding], className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-heading text-ink-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </Tag>
  );
}
