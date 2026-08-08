'use client';

import { useState } from 'react';
import { inputClass } from '@/components/form';
import { formatCurrency } from '@/lib/format';

/** שדה סכום בשקלים, עם תצוגה מילולית חיה מתחתיו ("4.5 מיליון ₪"). */
export function MoneyInput({
  name,
  defaultValue,
  required,
  min = 0,
  placeholder,
}: {
  name: string;
  defaultValue?: number | null;
  required?: boolean;
  min?: number;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue != null ? String(defaultValue) : '');
  const numeric = Number(value);
  const showHint = value !== '' && Number.isFinite(numeric) && numeric > 0;

  return (
    <div>
      <div className="relative">
        <input
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
          className={`${inputClass} text-left pl-10`}
        />
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400">
          ₪
        </span>
      </div>
      <span className="mt-1.5 block text-xs font-semibold text-brand-700">
        {showHint ? formatCurrency(numeric) : ' '}
      </span>
    </div>
  );
}
