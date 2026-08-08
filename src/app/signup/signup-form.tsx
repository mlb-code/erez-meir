'use client';

import { useActionState } from 'react';
import { Field, FormAlert, inputClass, SubmitButton } from '@/components/form';
import { signUp, type AuthFormState } from '@/lib/actions/auth';

export function SignupForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(signUp, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormAlert error={state.error} notice={state.notice} />

      <Field label="שם מלא">
        <input name="full_name" type="text" required autoComplete="name" className={inputClass} />
      </Field>

      <Field label="טלפון" hint="הטלפון נחשף רק לצדדים שאישרו יחד את אותה החלפה.">
        <input
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          dir="ltr"
          className={`${inputClass} text-left`}
          placeholder="050-1234567"
        />
      </Field>

      <Field label="אימייל">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className={`${inputClass} text-left`}
          placeholder="you@example.com"
        />
      </Field>

      <Field label="סיסמה" hint="לפחות 8 תווים.">
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          dir="ltr"
          className={`${inputClass} text-left`}
        />
      </Field>

      <SubmitButton pendingLabel="נרשם…">הרשמה</SubmitButton>
    </form>
  );
}
