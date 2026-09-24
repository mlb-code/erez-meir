import { cx } from '@/components/ui/cx';

/**
 * הסימן של חליפין: שני גגות זהים, אחד מסובב ב-180° מול השני. סימטריה
 * סיבובית היא בדיוק מה שהמילה "חליפין" אומרת — מה שאני נותן שווה למה
 * שאני מקבל.
 *
 * הגגות מוסטים אופקית זה מול זה ולא מיושרים: כשהם מיושרים הם נסגרים
 * לצורת מעוין אחת, וההיסט הוא מה שמשאיר שתי צורות נפרדות שהחליפו מקום.
 * צבע אחד בלבד (currentColor) והגגות הם חורים שקופים ולא צבע שני, כך
 * שהסימן עובד על כל רקע ונשאר קריא ב-32px ובתגית הדפדפן.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cx('shrink-0', className ?? 'h-9 w-9 text-brand-600')}
      role="img"
      aria-label="חליפין"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M24 0A24 24 0 1 1 24 48 24 24 0 0 1 24 0Z
           M16.4 19.2 29 7.2l12.6 12h-8.7L29 15.49l-3.9 3.71Z
           M31.6 28.8 19 40.8 6.4 28.8h8.7L19 32.51l3.9-3.71Z"
      />
    </svg>
  );
}

/** הסימן יחד עם שם המותג — מה שמופיע בראש האתר ובתחתיתו. */
export function LogoLockup({
  className,
  markClassName = 'h-9 w-9 text-brand-600',
  textClassName = 'text-heading text-ink-900',
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cx('flex items-center gap-2.5', className)}>
      <Logo className={markClassName} />
      <span className={cx('font-extrabold tracking-tight', textClassName)}>חליפין</span>
    </span>
  );
}
