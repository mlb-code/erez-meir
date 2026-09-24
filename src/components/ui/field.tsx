import { cx } from './cx';

/**
 * התשתית המשותפת לכל שדות הטופס: תווית, טקסט עזר, הודעת שגיאה וחיווט ARIA.
 * Input, Select ו-Textarea בונים את עצמם מעליה, ולכן שלושתם מתנהגים זהה.
 *
 * המזהה נגזר מ-name ולא מ-useId, כדי שהשדות יעבדו גם בקומפוננטות שרת
 * (מסך הסינון של הלוח, למשל, הוא טופס GET בלי JavaScript בכלל).
 */
export interface FieldProps {
  /** תווית השדה. חובה — אין שדה בלי תווית נראית. */
  label: string;
  /** טקסט עזר מתחת לשדה. נעלם כשיש שגיאה. */
  hint?: string;
  /** הודעת שגיאה. נוכחותה מסמנת את השדה כשגוי. */
  error?: string;
}

export function fieldIds(name: string | undefined, id: string | undefined) {
  const base = id ?? (name ? `field-${name}` : undefined);
  return {
    id: base,
    hintId: base ? `${base}-hint` : undefined,
    errorId: base ? `${base}-error` : undefined,
  };
}

/** ה-aria שכל פקד מקבל: סימון שגיאה והפניה לטקסט שמסביר אותו. */
export function describedBy(
  { hintId, errorId }: { hintId?: string; errorId?: string },
  { hint, error }: FieldProps,
) {
  if (error) return errorId;
  return hint ? hintId : undefined;
}

export function FieldShell({
  label,
  hint,
  error,
  id,
  hintId,
  errorId,
  className,
  children,
}: FieldProps & {
  id?: string;
  hintId?: string;
  errorId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx('block', className)}>
      <label htmlFor={id} className="mb-1.5 block text-caption font-semibold text-ink-700">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-caption leading-snug text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-caption leading-snug font-semibold text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** המראה המשותף לכל פקד — אותו גובה, אותו רדיוס, אותה טבעת מיקוד. */
export const CONTROL_BASE =
  'w-full rounded-field border bg-surface px-3.5 text-body text-ink-900 outline-none ' +
  'transition-colors placeholder:text-ink-400 ' +
  'disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500';

export const CONTROL_HEIGHT = 'h-11';

export function controlTone(invalid: boolean): string {
  return invalid
    ? 'border-danger-400 focus:border-danger-500 focus:ring-2 focus:ring-danger-100'
    : 'border-line-strong focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
}
