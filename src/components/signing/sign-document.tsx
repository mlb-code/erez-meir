'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Alert, Button, Card } from '@/components/ui';
import { signDocumentAction } from '@/lib/signing/actions';
import type { DocumentKind } from '@/lib/types';

/**
 * קומפוננטת חתימה (איפיון §10.1): מציגה את הטקסט, דורשת גלילה עד הסוף וסימון הסכמה,
 * מחשבת בדפדפן SHA-256 של הטקסט שהוצג, ושולחת לשרת — שמאמת שההash זהה למה שהוא מרנדר.
 * שלב קוד ה-SMS מופיע רק כש-verificationMethod === 'sms' (SMS נסגר בסוף).
 */
export function SignDocument({
  kind, title, text, hash, verificationMethod, vars, relatedMatchId, relatedListingId, onSigned,
}: {
  kind: DocumentKind; title: string; text: string; hash: string;
  verificationMethod: 'none' | 'sms' | 'email';
  vars: Record<string, string | number | null>;
  relatedMatchId?: string | null; relatedListingId?: string | null;
  onSigned?: (id: string) => void;
}) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [code, setCode] = useState('');
  const [clientHash, setClientHash] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<{ id: string; alreadySigned: boolean }>();
  const [pending, start] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);

  // hash בדפדפן על מה שהמשתמש רואה בפועל
  useEffect(() => {
    const normalized = text.replace(/\r\n/g, '\n').trim();
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized)).then((buf) =>
      setClientHash([...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')));
  }, [text]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 4) setScrolledToEnd(true);   // מסמך קצר — אין מה לגלול
  }, [text]);

  const hashMismatch = clientHash !== null && clientHash !== hash;
  const canSign = scrolledToEnd && agreed && !hashMismatch && !pending && !done
    && (verificationMethod === 'none' || code.length >= 4);

  function submit() {
    setError(undefined);
    start(async () => {
      const result = await signDocumentAction({
        kind, vars, relatedMatchId: relatedMatchId ?? null, relatedListingId: relatedListingId ?? null,
        presentedHash: hash, code: verificationMethod === 'none' ? undefined : code, scrolledToEnd, agreed,
      });
      if (result.ok) { setDone({ id: result.signedDocumentId, alreadySigned: result.alreadySigned }); onSigned?.(result.signedDocumentId); }
      else setError(result.error);
    });
  }

  return (
    <Card as="section" padding="none">
      <header className="border-b border-ink-100 px-5 py-4">
        <h2 className="text-heading text-ink-900">{title}</h2>
        <p className="mt-1 text-xs text-ink-500">
          יש לקרוא את המסמך עד סופו. הנוסח שיישמר מזוהה בחתימה דיגיטלית:
          <span className="mr-1 font-mono text-[11px] text-ink-400" dir="ltr">{hash.slice(0, 16)}…</span>
        </p>
      </header>

      <div
        ref={boxRef}
        onScroll={(e) => { const el = e.currentTarget; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setScrolledToEnd(true); }}
        className="max-h-[50vh] overflow-y-auto px-5 py-4 text-caption leading-relaxed whitespace-pre-wrap text-ink-800"
      >
        {text}
      </div>

      <footer className="flex flex-col gap-3 border-t border-ink-100 px-5 py-4">
        {!scrolledToEnd && (
          <p className="text-xs font-semibold text-warning-800">גלול עד סוף המסמך כדי להמשיך.</p>
        )}
        {hashMismatch && <Alert tone="error">הנוסח שהוצג אינו תואם לנוסח בשרת. יש לרענן את הדף.</Alert>}

        <label className="flex items-start gap-2 text-caption text-ink-800">
          <input type="checkbox" checked={agreed} disabled={!scrolledToEnd || !!done} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 accent-brand-600" />
          <span>קראתי את המסמך במלואו ואני מסכים לתוכנו.</span>
        </label>

        {verificationMethod === 'sms' && !done && (
          <label className="block">
            <span className="mb-1 block text-caption font-semibold text-ink-700">קוד אימות שנשלח לטלפון</span>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={6} dir="ltr"
              className="h-11 w-40 rounded-field border border-line-strong bg-surface px-3 text-left text-body tracking-widest outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </label>
        )}

        {error && <Alert tone="error">{error}</Alert>}

        {done ? (
          <Alert tone="success">
            {done.alreadySigned
              ? 'המסמך הזה כבר נחתם על ידך.'
              : 'נחתם. עותק נשמר בחשבונך ויישלח לאימייל.'}
          </Alert>
        ) : (
          <Button
            onClick={submit}
            disabled={!canSign}
            size="lg"
            loading={pending}
            loadingLabel="חותם…"
            className="w-fit"
          >
            חתימה דיגיטלית
          </Button>
        )}
      </footer>
    </Card>
  );
}
