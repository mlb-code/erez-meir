import Link from 'next/link';
import { ChainIllustration } from '@/components/chain-illustration';
import { ListingCard } from '@/components/listing-card';
import { Badge, ButtonLink, Card } from '@/components/ui';
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

const STATS = [
  { value: 'עד 5', label: 'משתתפים במעגל אחד' },
  { value: 'אוטומטי', label: 'זיהוי המעגלים בכל פרסום מודעה' },
  { value: 'שקוף', label: 'פער המזומן מוצג בכל מעבר' },
];

export default async function HomePage() {
  const [listings, user] = await Promise.all([getActiveListings({}, 6), getCurrentUser()]);

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-gutter py-12 lg:grid-cols-2 lg:py-20">
          <div>
            <Badge tone="brand" size="md">
              הראשונה בישראל לעסקאות חליפין בנדל״ן
            </Badge>
            <h1 className="mt-4 text-display text-ink-900">
              במקום למכור דירה ואז לקנות אחרת — פשוט מחליפים
            </h1>
            <p className="mt-4 text-body leading-relaxed text-ink-600">
              מפרסמים את הדירה להחלפה, מגדירים מה מחפשים בתמורה, והמערכת מוצאת את ההתאמה. גם
              כשצריך מעגל של שלושה או ארבעה בעלי דירות כדי לסגור אותה.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={user ? '/new' : '/signup'} size="lg">
                פרסום הדירה שלי להחלפה
              </ButtonLink>
              <ButtonLink href="/listings" variant="secondary" size="lg">
                לצפייה בלוח ההחלפות
              </ButtonLink>
            </div>
          </div>

          <ChainIllustration />
        </div>
      </section>

      {/* ===== איך זה עובד ===== */}
      <section id="how-it-works" className="scroll-mt-20 bg-canvas">
        <div className="mx-auto max-w-5xl px-gutter py-14">
          <h2 className="text-title text-ink-900">איך זה עובד</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Card as="li" key={step.title} padding="lg">
                <span className="num flex h-10 w-10 items-center justify-center rounded-field bg-brand-600 text-heading font-extrabold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-heading text-ink-900">{step.title}</h3>
                <p className="mt-2 text-body leading-relaxed text-ink-600">{step.body}</p>
              </Card>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== הסבר על השרשראות ===== */}
      <section className="bg-surface">
        <div className="mx-auto max-w-5xl px-gutter py-14">
          <div className="rounded-panel bg-brand-950 p-8 text-white sm:p-12">
            <h2 className="text-display">הכוח האמיתי: מעגלים, לא רק זוגות</h2>
            <p className="mt-4 max-w-2xl text-body leading-relaxed text-brand-100">
              ליהודה דירת 3 חדרים בתל אביב, והוא רוצה 4 חדרים בהרצליה. אלא שרות, שיש לה בדיוק דירה
              כזו, לא מעוניינת בתל אביב — היא רוצה רמת השרון. ולדוד, שיש לו דירה ברמת השרון, דווקא
              מתאימה הדירה של יהודה בתל אביב.
            </p>
            <p className="mt-3 max-w-2xl text-body leading-relaxed text-brand-100">
              אף אחד מהשלושה לא היה מוצא את השני בחיפוש רגיל. המערכת מזהה את המעגל אוטומטית, מחשבת
              את פערי המזומן בכל מעבר בנפרד, ומציגה לכל אחד בדיוק כמה הוא משלים או מקבל.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-card bg-white/10 p-5">
                  <p className="text-title">{stat.value}</p>
                  <p className="mt-1 text-caption text-brand-100">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== חיפוש מהיר ===== */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-5xl px-gutter py-14">
          <h2 className="text-title text-ink-900">חיפוש מהיר לפי עיר</h2>
          <p className="mt-2 text-body text-ink-600">מה מוצע כרגע להחלפה באזור שמעניין אותך?</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {CITIES.map((city) => (
              <Link
                key={city}
                href={`/listings?city=${encodeURIComponent(city)}`}
                className="rounded-field border border-line-strong bg-surface px-4 py-2.5 text-caption font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== מודעות אחרונות ===== */}
      {listings.length > 0 && (
        <section className="bg-surface">
          <div className="mx-auto max-w-5xl px-gutter py-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-title text-ink-900">מודעות אחרונות</h2>
                <p className="mt-2 text-body text-ink-600">
                  בכל מודעה רואים גם מה הבעלים מחפש בתמורה.
                </p>
              </div>
              <Link
                href="/listings"
                className="text-body font-semibold text-brand-700 hover:underline"
              >
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
        <div className="mx-auto max-w-3xl px-gutter py-14 text-center">
          <h2 className="text-display text-white">
            הדירה שלך יכולה להיות החוליה שסוגרת מעגל
          </h2>
          <p className="mt-3 text-body leading-relaxed text-brand-50">
            הפרסום חינם, ולוקח כמה דקות. ברגע שהמודעה עולה, המערכת בודקת אותה מול כל המודעות
            האחרות ומחפשת מעגלים.
          </p>
          <ButtonLink
            href={user ? '/new' : '/signup'}
            size="lg"
            className="mt-7 bg-white text-brand-700 hover:bg-brand-50 active:bg-brand-100 focus-visible:ring-white focus-visible:ring-offset-brand-600"
          >
            {user ? 'לפרסום מודעה' : 'פתיחת חשבון ופרסום מודעה'}
          </ButtonLink>
          <p className="mx-auto mt-8 max-w-2xl text-xs leading-relaxed text-brand-100">
            {LEGAL_DISCLAIMER}
          </p>
        </div>
      </section>
    </div>
  );
}
