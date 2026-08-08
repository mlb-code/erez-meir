'use client';

import { useActionState, useState } from 'react';
import { Field, FormAlert, inputClass, SubmitButton } from '@/components/form';
import { signIn, type AuthFormState } from '@/lib/actions/auth';

/** חשבונות מתוך נתוני הדמו — מקצרים את הדרך להדגמה. */
const DEMO_ACCOUNTS = [
  { email: 'yehuda@demo.swap.co.il', name: 'יהודה', hint: 'התאמה ישירה חדשה' },
  { email: 'eran@demo.swap.co.il', name: 'ערן', hint: 'שרשרת של 4 עם צ׳אט פתוח' },
  { email: 'gil@demo.swap.co.il', name: 'גיל', hint: 'שרשרת של 3 חדשה' },
  { email: 'david@demo.swap.co.il', name: 'דוד', hint: 'שרשרת שממתינה לאישורים' },
];
const DEMO_PASSWORD = 'Demo1234!';

export function LoginForm({ redirect }: { redirect?: string }) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(signIn, {});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        {redirect && <input type="hidden" name="redirect" value={redirect} />}
        <FormAlert error={state.error} notice={state.notice} />

        <Field label="אימייל">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            dir="ltr"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`${inputClass} text-left`}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="סיסמה">
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            dir="ltr"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${inputClass} text-left`}
          />
        </Field>

        <SubmitButton pendingLabel="מתחבר…">התחברות</SubmitButton>
      </form>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">כניסה מהירה לחשבון הדגמה</p>
        <p className="mt-1 text-xs text-slate-500">
          נתוני דמו בלבד. בחירה ממלאת את הטופס — נשאר רק ללחוץ על &quot;התחברות&quot;.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword(DEMO_PASSWORD);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <span className="block font-semibold text-slate-800">{account.name}</span>
              <span className="block text-xs text-slate-500">{account.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
