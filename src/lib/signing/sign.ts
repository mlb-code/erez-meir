import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { DocumentKind } from '@/lib/types';
import { contentHash, renderTemplate, type TemplateVars } from './render';
import { activeVerificationMethod, verifySecondFactor } from './second-factor';

/**
 * ליבת החתימה (איפיון §10.1): מרנדר את התבנית העדכנית, מחשב hash, שומר שורת ראיה
 * ב-signed_documents, ומתזמן עותק במייל (תור notifications — נשלח כשיהיה ספק מייל, E1).
 */

export interface DocumentTemplate {
  id: string; kind: DocumentKind; version: number; title: string; body_markdown: string;
}

export interface SignInput {
  kind: DocumentKind;
  vars: TemplateVars;
  relatedMatchId?: string | null;
  relatedListingId?: string | null;
  /** hash שהלקוח חישב על מה שהוצג לו — חייב להתאים למה שהשרת מרנדר. */
  presentedHash: string;
  code?: string;
}

export type SignResult =
  | { ok: true; signedDocumentId: string; alreadySigned: boolean }
  | { ok: false; error: string };

/** התבנית העדכנית מסוג מסוים (הגרסה הגבוהה ביותר שכבר בתוקף). */
export async function getCurrentTemplate(kind: DocumentKind): Promise<DocumentTemplate | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('document_templates')
    .select('id, kind, version, title, body_markdown')
    .eq('kind', kind)
    .lte('effective_from', new Date().toISOString())
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as DocumentTemplate | null) ?? null;
}

/** מה להציג למשתמש: הטקסט המרונדר + ה-hash שלו + גרסה. */
export async function prepareDocument(kind: DocumentKind, vars: TemplateVars) {
  const template = await getCurrentTemplate(kind);
  if (!template) return null;
  const text = renderTemplate(template.body_markdown, vars);
  return { template, text, hash: contentHash(text), verificationMethod: activeVerificationMethod() };
}

export async function signDocument(input: SignInput): Promise<SignResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'נדרשת התחברות' };

  const prepared = await prepareDocument(input.kind, input.vars);
  if (!prepared) return { ok: false, error: 'התבנית לא נמצאה' };

  // מה שהוצג = מה שנחתם. אם השרת מרנדר משהו אחר — לא חותמים.
  if (prepared.hash !== input.presentedHash) {
    return { ok: false, error: 'הנוסח השתנה מאז שהוצג. יש לרענן ולקרוא שוב.' };
  }

  const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).maybeSingle();
  const factor = await verifySecondFactor({ code: input.code, phone: profile?.phone });
  if (!factor.ok) return { ok: false, error: factor.error ?? 'האימות נכשל' };

  const headerList = await headers();
  const ip = (headerList.get('x-forwarded-for') ?? '').split(',')[0].trim() || null;
  const userAgent = headerList.get('user-agent');

  const { data: inserted, error } = await supabase
    .from('signed_documents')
    .insert({
      user_id: user.id,
      kind: input.kind,
      template_id: prepared.template.id,
      template_version: prepared.template.version,
      content_hash: prepared.hash,
      ip, user_agent: userAgent,
      otp_verified: factor.method !== 'none',
      verification_method: factor.method,
      related_match_id: input.relatedMatchId ?? null,
      related_listing_id: input.relatedListingId ?? null,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    // אינדקס ייחודי: כבר חתם על אותו מסמך באותו הקשר — זה לא כשל.
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('signed_documents').select('id')
        .eq('user_id', user.id).eq('kind', input.kind).eq('template_version', prepared.template.version)
        .is('related_match_id', input.relatedMatchId ?? null)
        .limit(1).maybeSingle();
      return { ok: true, signedDocumentId: existing?.id ?? '', alreadySigned: true };
    }
    return { ok: false, error: 'שמירת החתימה נכשלה' };
  }

  // עותק במייל — לתור. יישלח כשספק המייל יחובר (E1).
  await supabase.from('notifications').insert({
    user_id: user.id, channel: 'email', template: 'signed_document_copy',
    payload: { kind: input.kind, title: prepared.template.title, version: prepared.template.version, hash: prepared.hash, signed_document_id: inserted?.id },
  });

  if (input.kind === 'terms') {
    await supabase.from('profiles').update({ terms_signed_at: new Date().toISOString() }).eq('id', user.id);
  }

  return { ok: true, signedDocumentId: inserted!.id, alreadySigned: false };
}
