'use client';

import { useActionState } from 'react';
import { FormAlert, Input, SubmitButton } from '@/components/ui';
import { updateProfile, type AuthFormState } from '@/lib/actions/auth';
import type { Profile } from '@/lib/types';

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(updateProfile, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormAlert error={state.error} notice={state.notice} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="שם מלא" name="full_name" required defaultValue={profile?.full_name ?? ''} />
        <Input
          label="טלפון"
          name="phone"
          type="tel"
          required
          dir="ltr"
          inputClassName="text-left"
          defaultValue={profile?.phone ?? ''}
          placeholder="050-1234567"
          hint="נחשף רק למי שאישר איתך את אותה החלפה."
        />
      </div>

      <p className="text-caption text-ink-500">
        אימייל: <span className="num font-semibold text-ink-700">{email}</span>
      </p>

      <div className="sm:w-48">
        <SubmitButton pendingLabel="שומר…">שמירת הפרטים</SubmitButton>
      </div>
    </form>
  );
}
