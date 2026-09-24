import {
  CONTROL_BASE,
  controlTone,
  describedBy,
  fieldIds,
  FieldShell,
  type FieldProps,
} from './field';
import { cx } from './cx';

export type TextareaProps = FieldProps &
  Omit<React.ComponentProps<'textarea'>, 'className'> & {
    className?: string;
    textareaClassName?: string;
  };

export function Textarea({
  label,
  hint,
  error,
  className,
  textareaClassName,
  id,
  name,
  rows = 5,
  ...props
}: TextareaProps) {
  const ids = fieldIds(name, id);

  return (
    <FieldShell label={label} hint={hint} error={error} className={className} {...ids}>
      <textarea
        {...props}
        rows={rows}
        id={ids.id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, { label, hint, error })}
        className={cx(
          CONTROL_BASE,
          controlTone(Boolean(error)),
          'resize-y py-2.5 leading-relaxed',
          textareaClassName,
        )}
      />
    </FieldShell>
  );
}
