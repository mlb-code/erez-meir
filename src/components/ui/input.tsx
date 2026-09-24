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

export type InputProps = FieldProps &
  Omit<React.ComponentProps<'input'>, 'className'> & {
    /** class נוסף לפקד עצמו (למשל text-left לשדות בלטינית). */
    inputClassName?: string;
    /** class נוסף לעטיפה, לפריסה בתוך grid. */
    className?: string;
  };

export function Input({
  label,
  hint,
  error,
  className,
  inputClassName,
  id,
  name,
  ...props
}: InputProps) {
  const ids = fieldIds(name, id);

  return (
    <FieldShell label={label} hint={hint} error={error} className={className} {...ids}>
      <input
        {...props}
        id={ids.id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, { label, hint, error })}
        className={cx(CONTROL_BASE, CONTROL_HEIGHT, controlTone(Boolean(error)), inputClassName)}
      />
    </FieldShell>
  );
}
