import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'התחברות' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/matches');

  const { redirect: redirectTo } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-extrabold text-slate-900">התחברות</h1>
      <p className="mt-2 text-sm text-slate-600">
        עוד אין לך חשבון?{' '}
        <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
          להרשמה
        </Link>
      </p>

      <div className="mt-6">
        <LoginForm redirect={redirectTo} />
      </div>
    </div>
  );
}
