import Link from 'next/link';

const STEPS = ['פרטי הדירה', 'תמונות', 'שווי מבוקש', 'מה אני מחפש'];

export function Stepper({ current, listingId }: { current: number; listingId?: string }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const state = step === current ? 'current' : step < current ? 'done' : 'todo';
        const canJump = Boolean(listingId) && step < current;

        const content = (
          <>
            <span
              className={`num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                state === 'current'
                  ? 'bg-brand-600 text-white'
                  : state === 'done'
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step}
            </span>
            <span
              className={`hidden text-sm font-medium sm:inline ${
                state === 'current' ? 'text-brand-800' : 'text-slate-500'
              }`}
            >
              {label}
            </span>
          </>
        );

        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            {canJump ? (
              <Link href={`/new?id=${listingId}&step=${step}`} className="flex items-center gap-2">
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-2">{content}</div>
            )}
            {step < STEPS.length && (
              <span
                className={`h-0.5 flex-1 rounded ${step < current ? 'bg-brand-300' : 'bg-slate-200'}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
