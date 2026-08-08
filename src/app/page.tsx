import Link from 'next/link';
import { ChainIllustration } from '@/components/chain-illustration';
import { ListingCard } from '@/components/listing-card';
import { CITIES, LEGAL_DISCLAIMER } from '@/lib/constants';
import { getActiveListings } from '@/lib/data/listings';
import { getCurrentUser } from '@/lib/supabase/server';

const STEPS = [
  {
    title: 'מפרסמים את הדירה להחלפה',
    body: 'לא רק מה יש לך — גם מה אתה רוצה לקבל בתמורה: אזורים, גודל, מאפיינים, וכמה מזומן אתה מוכן להוסיף או דורש לקבל.',
  },
  {
    title: 'המערכת מוצאת התאמות ומעגלים',
    body: 'התאמה ישירה בין שתי דירות, או מעגל של שלושה עד חמישה בעלי דירות — גם כשאף אחד מהם לא רוצה דווקא את הדירה של השני.',
  },
  {
    title: 'נפגשים וסוגרים בליווי עורכי דין',
    body: 'כשכל המשתתפים במעגל מסמנים "מעוניין", נפתח צ׳אט משותף. משם ממשיכים עם עורכי הדין של הצדדים.',
  },
];

export default async function HomePage() {
  const [listings, user] = await Promise.all([getActiveListings({}, 6), getCurrentUser()]);

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
              הראשונה בישראל לעסקאות חליפין בנדל״ן
            </span>
            <h1 className="mt-4 text-3xl leading-tight font-extrabold text-slate-900 sm:text-4xl lg:text-5xl">
              במקום למכור דירה ואז לקנות אחרת — פשוט מחליפים
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              מפרסמים את הדירה שלכם להחלפה, מגדירים מה אתם מחפשים בתמורה, והמערכת מוצאת את
              ההתאמה. גם כשצריך מעגל של שלושה או ארבעה בעלי דירות כדי לסגור אותה.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={user ? '/new' : '/signup'}
                className="rounded-xl bg-brand-600 px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-brand-700"
              >
                פרסום הדירה שלי להחלפה
              </Link>
              <Link
                href="/listings"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                לצפייה בלוח ההחלפות
              </Link>
            </div>
          </div>

          <ChainIllustration />
        </div>
      </section>

      {/* ===== איך זה עובד ===== */}
      <section id="how-it-works" className="scroll-mt-20 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">איך זה עובד</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="num flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-extrabold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== הסבר על השרשראות ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <div className="rounded-3xl bg-brand-950 p-8 text-white sm:p-12">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              הכוח האמיתי: מעגלים, לא רק זוגות
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-brand-100">
              ליהודה דירת 3 חדרים בתל אביב, והוא רוצה 4 חדרים בהרצליה. אלא שרות, שיש לה בדיוק דירה
              כזו, לא מעוניינת בתל אביב — היא רוצה רמת השרון. ולדוד, שיש לו דירה ברמת השרון, דווקא
              מתאימה הדירה של יהודה בתל אביב.
            </p>
            <p className="mt-3 max-w-2xl leading-relaxed text-brand-100">
              אף אחד מהשלושה לא היה מוצא את השני בחיפוש רגיל. המערכת מזהה את המעגל אוטומטית,
              מחשבת את פערי המזומן בכל מעבר בנפרד, ומציגה לכל אחד בדיוק כמה הוא משלים או מקבל.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { value: 'עד 5', label: 'משתתפים במעגל אחד' },
                { value: 'אוטומטי', label: 'זיהוי המעגלים בכל פרסום מודעה' },
                { value: 'שקוף', label: 'פער המזומן מוצג בכל מעבר' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/10 p-5">
                  <p className="text-2xl font-extrabold">{stat.value}</p>
                  <p className="mt-1 text-sm text-brand-100">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== חיפוש מהיר ===== */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-extrabold text-slate-900">חיפוש מהיר לפי עיר</h2>
          <p className="mt-2 text-slate-600">מה מוצע כרגע להחלפה באזור שמעניין אתכם?</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {CITIES.map((city) => (
              <Link
                key={city}
                href={`/listings?city=${encodeURIComponent(city)}`}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== מודעות אחרונות ===== */}
      {listings.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">מודעות אחרונות</h2>
                <p className="mt-2 text-slate-600">
                  בכל מודעה רואים גם מה הבעלים מחפש בתמורה.
                </p>
              </div>
              <Link href="/listings" className="font-semibold text-brand-700 hover:underline">
                לכל המודעות →
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== קריאה לפעולה ===== */}
      <section className="bg-brand-600">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            הדירה שלכם יכולה להיות החוליה שסוגרת מעגל
          </h2>
          <p className="mt-3 leading-relaxed text-brand-50">
            הפרסום חינם, ולוקח כמה דקות. ברגע שהמודעה עולה, המערכת בודקת אותה מול כל המודעות
            האחרות ומחפשת מעגלים.
          </p>
          <Link
            href={user ? '/new' : '/signup'}
            className="mt-7 inline-block rounded-xl bg-white px-7 py-3.5 text-base font-bold text-brand-700 transition-colors hover:bg-brand-50"
          >
            {user ? 'לפרסום מודעה' : 'פתיחת חשבון ופרסום מודעה'}
          </Link>
          <p className="mx-auto mt-8 max-w-2xl text-xs leading-relaxed text-brand-100">
            {LEGAL_DISCLAIMER}
          </p>
        </div>
      </section>
    </div>
  );
}
