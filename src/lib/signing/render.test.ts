import { describe, expect, it } from 'vitest';
import { contentHash, maskIdNumber, renderTemplate, templateVariables } from './render';
import { activeVerificationMethod, verifySecondFactor } from './second-factor';

describe('רינדור תבניות', () => {
  it('1. מחליף משתנים, ומשאיר גלוי משתנה חסר', () => {
    const out = renderTemplate('שלום {{full_name}}, גוש {{gush}} חלקה {{ helka }}', { full_name: 'ערן', gush: 6111 });
    expect(out).toBe('שלום ערן, גוש 6111 חלקה {{ helka }}');
  });
  it('2. hash יציב, לא תלוי בסוג שורות ורווחים בקצוות', () => {
    const a = contentHash('שורה 1\nשורה 2\n');
    const b = contentHash('  שורה 1\r\nשורה 2  ');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
  it('3. שינוי של תו אחד = hash אחר', () => {
    expect(contentHash('0.5% + מע"מ')).not.toBe(contentHash('0.5% + מע״מ'));
  });
  it('4. מזהה את המשתנים שתבנית דורשת, בלי כפילויות', () => {
    expect(templateVariables('{{a}} {{b}} {{a}} {{ c }}')).toEqual(['a', 'b', 'c']);
  });
  it('5. ת"ז מוצגת ממוסכת', () => {
    expect(maskIdNumber('0018')).toBe('*****0018');
    expect(maskIdNumber(null)).toBe('—');
  });
});

describe('אמצעי אימות שני — SMS נסגר בסוף', () => {
  it('6. בלי SMS_ENABLED — שיטה none, והאימות עובר בלי קוד', async () => {
    delete process.env.SMS_ENABLED;
    expect(activeVerificationMethod()).toBe('none');
    expect(await verifySecondFactor({})).toEqual({ ok: true, method: 'none' });
  });
  it('7. עם SMS_ENABLED=true — דורש קוד וטלפון, וכרגע לא מחובר', async () => {
    process.env.SMS_ENABLED = 'true';
    expect(activeVerificationMethod()).toBe('sms');
    expect((await verifySecondFactor({})).ok).toBe(false);
    expect((await verifySecondFactor({ code: '123456', phone: '+972500000001' })).ok).toBe(false);
    delete process.env.SMS_ENABLED;
  });
});
