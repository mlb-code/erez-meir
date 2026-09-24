'use client';

import { useActionState } from 'react';
import { FormAlert, Input, SubmitButton } from '@/components/ui';
import { signUp, type AuthFormState } from '@/lib/actions/auth';

export function SignupForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(signUp, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormAlert error={state.error} notice={state.notice} />

      <Input label="שם מלא" name="full_name" type="text" required autoComplete="name" />

      <Input
        label="טלפון"
        name="phone"
        type="tel"
        required
        autoComplete="tel"
        dir="ltr"
        inputClassName="text-left"
        placeholder="050-1234567"
        hint="הטלפון נחשף רק לצדדים שאישרו יחד את אותה החלפה."
      />

      <Input
        label="אימייל"
        name="email"
        type="email"
        required
        autoComplete="email"
        dir="ltr"
        inputClassName="text-left"
        hint="לכתובת הזאת יישלח מייל אימות."
      />

      <Input
        label="סיסמה"
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        dir="ltr"
        inputClassName="text-left"
        hint="לפחות 8 תווים."
      />

      <SubmitButton pendingLabel="נרשם…">הרשמה</SubmitButton>
    </form>
  );
}
