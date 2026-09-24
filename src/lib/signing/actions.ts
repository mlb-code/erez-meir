'use server';

import { z } from 'zod';
import type { DocumentKind } from '@/lib/types';
import { signDocument, type SignResult } from './sign';

const schema = z.object({
  kind: z.enum(['terms', 'privacy', 'brokerage_order', 'meeting_confirmation', 'closing_report']),
  vars: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).default({}),
  relatedMatchId: z.string().uuid().nullable().optional(),
  relatedListingId: z.string().uuid().nullable().optional(),
  presentedHash: z.string().regex(/^[a-f0-9]{64}$/),
  code: z.string().max(10).optional(),
  scrolledToEnd: z.literal(true, { message: 'יש לקרוא את המסמך עד סופו' }),
  agreed: z.literal(true, { message: 'יש לאשר את המסמך' }),
});

/** Server Action: חתימה על מסמך. הקלט מגיע מהקומפוננטה SignDocument. */
export async function signDocumentAction(raw: unknown): Promise<SignResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { kind, vars, relatedMatchId, relatedListingId, presentedHash, code } = parsed.data;
  return signDocument({ kind: kind as DocumentKind, vars, relatedMatchId, relatedListingId, presentedHash, code });
}
