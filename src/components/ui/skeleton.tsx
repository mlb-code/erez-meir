import { cx } from './cx';

/**
 * שלד טעינה. aria-hidden כי אין כאן תוכן לקורא מסך — הדף שמכיל אותו
 * הוא שאחראי להודיע שהוא בטעינה. ההבהוב נעצר לבד תחת prefers-reduced-motion.
 */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx('block animate-pulse bg-ink-200', className)} />;
}

/** כמה שורות טקסט מדומות. האחרונה קצרה יותר, כמו שורת סיום אמיתית. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <span className={cx('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cx('h-3.5 rounded-chip', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </span>
  );
}

/** שלד של כרטיס מודעה — אותן פרופורציות של ListingCard, כדי שלא תהיה קפיצה. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cx('overflow-hidden rounded-card border border-line bg-surface', className)}>
      <Skeleton className="aspect-16/10 w-full" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-4 w-1/2 rounded-chip" />
        <Skeleton className="h-3 w-2/3 rounded-chip" />
        <Skeleton className="h-16 w-full rounded-field" />
      </div>
    </div>
  );
}
