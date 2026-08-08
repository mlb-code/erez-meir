'use client';

import { useActionState } from 'react';
import { Field, FormAlert, inputClass, SubmitButton } from '@/components/form';
import { updateProfile, type AuthFormState } from '@/lib/actions/auth';
import type { Profile } from '@/lib/types';

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(updateProfile, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormAlert error={state.error} notice={state.notice} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="שם מלא">
          <input
            name="full_name"
            required
            defaultValue={profile?.full_name ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="טלפון" hint="נחשף רק למי שאישר איתך את אותה החלפה.">
          <input
            name="phone"
            type="tel"
            required
            dir="ltr"
            defaultValue={profile?.phone ?? ''}
            className={`${inputClass} text-left`}
            placeholder="050-1234567"
          />
        </Field>
      </div>

      <p className="text-sm text-slate-500">
        אימייל: <span className="num font-semibold text-slate-700">{email}</span>
      </p>

      <div className="sm:w-48">
        <SubmitButton pendingLabel="שומר…">שמירת הפרטים</SubmitButton>
      </div>
    </form>
  );
}
