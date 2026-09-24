import {
  CONTROL_BASE,
  CONTROL_HEIGHT,
  controlTone,
  describedBy,
  fieldIds,
  FieldShell,
  type FieldProps,
} from './field';
import { cx } from './cx';

export type SelectProps = FieldProps &
  Omit<React.ComponentProps<'select'>, 'className'> & {
    className?: string;
    selectClassName?: string;
  };

/**
 * select מקומי עם חץ משלנו במקום החץ של מערכת ההפעלה — אחרת כל דפדפן
 * מצייר משהו אחר, והטופס נראה מורכב משני עולמות. החץ יושב בצד שמאל,
 * הצד ה"מאוחר" של שורה בעברית.
 */
export function Select({
  label,
  hint,
  error,
  className,
  selectClassName,
  id,
  name,
  children,
  ...props
}: SelectProps) {
  const ids = fieldIds(name, id);

  return (
    <FieldShell label={label} hint={hint} error={error} className={className} {...ids}>
      <div className="relative">
        <select
          {...props}
          id={ids.id}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, { label, hint, error })}
          className={cx(
            CONTROL_BASE,
            CONTROL_HEIGHT,
            controlTone(Boolean(error)),
            'appearance-none pl-10',
            selectClassName,
          )}
        >
          {children}
        </select>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </FieldShell>
  );
}
