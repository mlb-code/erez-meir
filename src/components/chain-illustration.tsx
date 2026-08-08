/**
 * שווי הדירות באיור נבחר כך שהחשבון ייסגר בדיוק:
 *   יהודה 4.5 → רות 4.7 (משלים 200 אלף)
 *   רות   4.7 → דוד 5.0 (משלים 300 אלף)
 *   דוד   5.0 → יהודה 4.5 (מקבל 500 אלף)
 */
const NODES = [
  { name: 'יהודה', city: 'תל אביב', detail: '3 חדרים · 4.5 מ׳', left: '50%', top: '18.3%' },
  { name: 'רות', city: 'הרצליה', detail: '4 חדרים · 4.7 מ׳', left: '81.7%', top: '71.7%' },
  { name: 'דוד', city: 'רמת השרון', detail: '5 חדרים · 5 מ׳', left: '18.3%', top: '71.7%' },
];

const CASH = [
  { text: 'משלים 200 אלף ₪', paying: true, left: '73.7%', top: '40.3%' },
  { text: 'משלים 300 אלף ₪', paying: true, left: '50%', top: '81%' },
  { text: 'מקבל 500 אלף ₪', paying: false, left: '26%', top: '40.3%' },
];

/**
 * איור של מעגל החלפה תלת־כיווני — הרעיון המרכזי של המוצר בתמונה אחת.
 * החצים מצוירים ב-SVG, הכרטיסים עצמם ב-HTML כדי שהטקסט העברי יתנהג כראוי.
 */
export function ChainIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <marker
            id="chain-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="fill-brand-500" />
          </marker>
        </defs>

        <g
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stroke-brand-400"
          markerEnd="url(#chain-arrow)"
        >
          <path d="M176.6,99.7 Q221.5,120.7 218.4,170.3" />
          <path d="M193,215 Q150,243 107,215" />
          <path d="M81.6,170.3 Q78.4,120.7 123.4,99.7" />
        </g>
      </svg>

      {NODES.map((node) => (
        <div
          key={node.name}
          style={{ left: node.left, top: node.top }}
          className="absolute w-28 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-2.5 text-center shadow-md sm:w-32"
        >
          <span className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-700" fill="currentColor">
              <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z" />
            </svg>
          </span>
          <p className="text-sm font-extrabold text-slate-900">{node.name}</p>
          <p className="text-xs text-slate-500">{node.city}</p>
          <p className="text-xs font-semibold text-slate-600">{node.detail}</p>
        </div>
      ))}

      {CASH.map((label) => (
        <span
          key={label.text}
          style={{ left: label.left, top: label.top }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-bold whitespace-nowrap shadow-sm ${
            label.paying ? 'bg-chain-100 text-chain-800' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {label.text}
        </span>
      ))}
    </div>
  );
}
