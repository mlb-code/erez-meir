'use client';

import { useState } from 'react';
import {
  CONTROL_BASE,
  CONTROL_HEIGHT,
  controlTone,
  type FieldProps,
} from '@/components/ui';
import { cx } from '@/components/ui/cx';
import { describedBy, fieldIds, FieldShell } from '@/components/ui/field';
import { formatCurrency } from '@/lib/format';

/** שדה סכום בשקלים, עם תצוגה מילולית חיה מתחתיו ("4.5 מיליון ₪"). */
export function MoneyInput({
  label,
  hint,
  error,
  name,
  defaultValue,
  required,
  min = 0,
  placeholder,
  className,
}: FieldProps & {
  name: string;
  defaultValue?: number | null;
  required?: boolean;
  min?: number;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue != null ? String(defaultValue) : '');
  const numeric = Number(value);
  const showHint = value !== '' && Number.isFinite(numeric) && numeric > 0;
  const ids = fieldIds(name, undefined);

  return (
    <FieldShell label={label} hint={hint} error={error} className={className} {...ids}>
      <div className="relative">
        <input
          id={ids.id}
          name={name}
          type="number"
          inputMode="numeric"
          step={1000}
          min={min}
          required={required}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          dir="ltr"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, { label, hint, error })}
          className={cx(CONTROL_BASE, CONTROL_HEIGHT, controlTone(Boolean(error)), 'pl-10 text-left')}
        />
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400">
          ₪
        </span>
      </div>
      <span className="mt-1.5 block text-caption font-semibold text-brand-700">
        {showHint ? formatCurrency(numeric) : ' '}
      </span>
    </FieldShell>
  );
}
