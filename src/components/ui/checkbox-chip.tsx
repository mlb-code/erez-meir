import { cx } from './cx';

/**
 * תיבת סימון בצורת שבב — הדפוס של "מה יש בדירה" ו"באילו אזורים".
 * הקלט עצמו נשאר תיבת סימון אמיתית, כך שמקלדת וקורא מסך עובדים כרגיל,
 * והמראה נגזר ממנו ב-has-checked.
 */
export function CheckboxChip({
  label,
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type' | 'className'> & {
  label: string;
  className?: string;
}) {
  return (
    <label
      className={cx(
        'flex cursor-pointer items-center gap-2 rounded-field border border-line-strong bg-surface px-3.5 py-2.5',
        'text-caption font-medium text-ink-700 transition-colors',
        'hover:border-ink-400',
        'has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-800',
        'has-focus-visible:ring-2 has-focus-visible:ring-brand-500 has-focus-visible:ring-offset-2',
        className,
      )}
    >
      <input type="checkbox" {...props} className="h-4 w-4 accent-brand-600" />
      {label}
    </label>
  );
}
