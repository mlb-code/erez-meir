export function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="23" className="fill-brand-600" />
      {/* חץ מעגלי — רומז על מעגל ההחלפה */}
      <path
        d="M13 20a11.5 11.5 0 0 1 19-4.3"
        className="stroke-brand-200"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M32.6 10.6l.6 5.6-5.6.5z" className="fill-brand-200" />
      <path
        d="M35 28a11.5 11.5 0 0 1-19 4.3"
        className="stroke-chain-300"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M15.4 37.4l-.6-5.6 5.6-.5z" className="fill-chain-300" />
      {/* בית */}
      <path d="M24 17.5l7.5 6.2V32a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8.3z" className="fill-white" />
      <rect x="22" y="26" width="4" height="7" rx="0.6" className="fill-brand-600" />
    </svg>
  );
}
