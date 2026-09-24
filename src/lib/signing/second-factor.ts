/**
 * אמצעי האימות השני לחתימה (איפיון §10.1, עיקרון 7: SMS נסגר בסוף).
 * היום: 'none' — החתימה מתועדת בלי קוד. כשיחובר Twilio: SMS_ENABLED=true → 'sms'.
 * המבנה כאן קיים כדי שההדלקה תהיה שינוי תצורה, לא שינוי קוד בזרימת החתימה.
 */
export type VerificationMethod = 'none' | 'sms' | 'email';

export function activeVerificationMethod(): VerificationMethod {
  return process.env.SMS_ENABLED === 'true' ? 'sms' : 'none';
}

export interface SecondFactorResult { ok: boolean; method: VerificationMethod; error?: string }

/**
 * מאמת את הקוד שהמשתמש הזין. ב-'none' תמיד עובר (אין קוד).
 * ב-'sms' — יאומת מול Supabase Phone Auth (verifyOtp) בחבילה B1 כשהדגל יידלק.
 */
export async function verifySecondFactor(input: { code?: string; phone?: string | null }): Promise<SecondFactorResult> {
  const method = activeVerificationMethod();
  if (method === 'none') return { ok: true, method };
  // TODO(B1, כשSMS_ENABLED): supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
  if (!input.code || !input.phone) return { ok: false, method, error: 'נדרש קוד אימות' };
  return { ok: false, method, error: 'אימות SMS עדיין לא מחובר' };
}
