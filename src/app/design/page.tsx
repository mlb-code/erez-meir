import type { Metadata } from 'next';
import { Showcase } from './showcase';
import { Alert } from '@/components/ui';

export const metadata: Metadata = {
  title: 'מערכת העיצוב',
  robots: { index: false, follow: false },
};

/** דף פנימי לצוות. לא מקושר מהאתר ולא נסרק — ראו robots למעלה. */
export default function DesignPage() {
  return (
    <div className="mx-auto max-w-4xl px-gutter py-10">
      <h1 className="text-display text-ink-900">מערכת העיצוב של חליפין</h1>
      <p className="mt-3 max-w-2xl text-body text-ink-600">
        כל הטוקנים מוגדרים ב-<code className="text-caption">src/app/globals.css</code> וכל
        הקומפוננטות ב-<code className="text-caption">src/components/ui</code>. הדף הזה הוא המקום
        לבדוק שינוי לפני שהוא נכנס למסכים.
      </p>

      <div className="mt-6">
        <Alert tone="warning" title="דף פנימי">
          לא מקושר מהאתר ומסומן ב-noindex. אין להפנות אליו לקוחות.
        </Alert>
      </div>

      <div className="mt-10">
        <Showcase />
      </div>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="text-heading text-ink-900">אותן קומפוננטות ברוחב 390 פיקסלים</h2>
        <p className="mt-1 max-w-2xl text-caption text-ink-500">
          זהו iframe אל <code>/design/mobile</code> ולא רק div צר — כך נקודות השבירה נפתרות
          באמת למובייל, וגלישה אופקית הייתה מופיעה כאן מיד.
        </p>
        <div className="mt-5 overflow-x-auto">
          <iframe
            src="/design/mobile"
            title="מערכת העיצוב ברוחב 390 פיקסלים"
            width={390}
            height={900}
            className="rounded-panel border-2 border-line-strong bg-surface shadow-raised"
          />
        </div>
      </section>
    </div>
  );
}
