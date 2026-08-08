import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignupForm } from './signup-form';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'הרשמה' };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect('/account');

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-extrabold text-slate-900">פתיחת חשבון</h1>
      <p className="mt-2 text-sm text-slate-600">
        כבר יש לך חשבון?{' '}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          להתחברות
        </Link>
      </p>

      <div className="mt-6">
        <SignupForm />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-slate-500">
        אחרי ההרשמה נשלח אליך מייל אימות. הפרטים האישיים שלך אינם מוצגים בלוח ההחלפות, ונחשפים רק
        לצדדים שאישרו יחד את אותה החלפה.
      </p>
    </div>
  );
}
