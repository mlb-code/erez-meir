'use client';

import { useFormStatus } from 'react-dom';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-700">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-base text-ink-900 ' +
  'outline-none transition-colors placeholder:text-ink-400 ' +
  'focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function FormAlert({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;
  return (
    <p
      role="status"
      className={`rounded-xl border px-4 py-3 text-sm ${
        error
          ? 'border-danger-200 bg-danger-50 text-danger-800'
          : 'border-brand-200 bg-brand-50 text-brand-800'
      }`}
    >
      {error ?? notice}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingLabel = 'רגע…',
  className = '',
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ||
        'w-full rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-300'
      }
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
