import { createHash } from 'node:crypto';

/**
 * רינדור תבנית מסמך: מחליף {{משתנים}} בערכים, ומחשב hash של הטקסט הסופי.
 * ה-hash הוא מה שנשמר ב-signed_documents.content_hash — ראיה לנוסח המדויק שהוצג ונחתם.
 */

export type TemplateVars = Record<string, string | number | null | undefined>;

/** משאיר {{שם}} כמו שהוא אם המשתנה חסר — כך חסר נראה בעין, לא נעלם בשקט. */
export function renderTemplate(body: string, vars: TemplateVars): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (whole, key: string) => {
    const value = vars[key];
    return value === null || value === undefined ? whole : String(value);
  });
}

/** SHA-256 של הטקסט אחרי נרמול שורות — כדי שאותו מסמך ייתן אותו hash בכל מערכת. */
export function contentHash(text: string): string {
  return createHash('sha256').update(text.replace(/\r\n/g, '\n').trim(), 'utf8').digest('hex');
}

/** שמות המשתנים שתבנית מצפה להם. */
export function templateVariables(body: string): string[] {
  return [...new Set([...body.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map((m) => m[1]))];
}

/** מספר ת"ז להצגה במסמך: רק 4 ספרות אחרונות. */
export function maskIdNumber(last4: string | null | undefined): string {
  return last4 ? `*****${last4}` : '—';
}
