import { describe, expect, it } from 'vitest';
import { purchaseTax, shevachTax, simulateSide, simulateDirectSwap } from './simulator';
import { PLATFORM_FEE, SHEVACH, VAT_RATE } from './rules-2026';

const D = (s: string) => new Date(s);
const SALE = D('2026-09-22');

describe('מס רכישה — מדרגות 2026', () => {
  it('1. הדוגמה מהתוכנית העסקית: דירה יחידה 2.6 מיליון → כ-25,500 ₪', () => {
    const r = purchaseTax({ value: 2_600_000, assetType: 'apartment', isSingleHome: true });
    expect(r.tax).toBeGreaterThanOrEqual(25_400);
    expect(r.tax).toBeLessThanOrEqual(25_600);
    expect(r.track).toBe('single_home');
  });

  it('2. הדוגמה מהתוכנית העסקית: דירה יחידה 2.2 מיליון → כ-7,700 ₪', () => {
    const r = purchaseTax({ value: 2_200_000, assetType: 'apartment', isSingleHome: true });
    expect(r.tax).toBeGreaterThanOrEqual(7_650);
    expect(r.tax).toBeLessThanOrEqual(7_800);
  });

  it('3. מתחת למדרגה הראשונה — אפס מס לדירה יחידה', () => {
    expect(purchaseTax({ value: 1_900_000, assetType: 'apartment', isSingleHome: true }).tax).toBe(0);
  });

  it('4. בדיוק על גבול המדרגה הראשונה — עדיין אפס', () => {
    expect(purchaseTax({ value: 1_978_745, assetType: 'apartment', isSingleHome: true }).tax).toBe(0);
    expect(purchaseTax({ value: 1_978_746, assetType: 'apartment', isSingleHome: true }).tax).toBe(0); // 1 ₪ × 3.5% מתעגל ל-0
  });

  it('5. דירה נוספת — 8% מהשקל הראשון', () => {
    const r = purchaseTax({ value: 2_200_000, assetType: 'apartment', isSingleHome: false });
    expect(r.tax).toBe(176_000);
    expect(r.track).toBe('additional_home');
  });

  it('6. דירה נוספת מעל 6,055,070 — 10% על העודף', () => {
    const r = purchaseTax({ value: 7_000_000, assetType: 'apartment', isSingleHome: false });
    expect(r.tax).toBe(Math.round(6_055_070 * 0.08 + (7_000_000 - 6_055_070) * 0.10));
  });

  it('7. נכס מסחרי — 6% אחיד, בלי קשר לדירה יחידה', () => {
    const r = purchaseTax({ value: 3_000_000, assetType: 'office', isSingleHome: true });
    expect(r.tax).toBe(180_000);
    expect(r.track).toBe('non_residential');
  });

  it('8. פירוט המדרגות מסתכם לסך המס', () => {
    const r = purchaseTax({ value: 4_500_000, assetType: 'apartment', isSingleHome: true });
    expect(Math.round(r.lines.reduce((s, l) => s + l.tax, 0))).toBe(r.tax);
    expect(r.lines).toHaveLength(3);
  });
});

describe('מס שבח', () => {
  const base = { saleValue: 3_000_000, assetType: 'apartment' as const, purchaseValue: 2_000_000, purchaseDate: D('2018-06-01'), saleDate: SALE };

  it('9. דירה יחידה מזכה, מעל 18 חודשים, מתחת לתקרה — פטור מלא', () => {
    const r = shevachTax({ ...base, isSingleQualifyingHome: true });
    expect(r.exempt).toBe(true);
    expect(r.tax).toBe(0);
    expect(r.exemptionReason).toContain('49ב(2)');
  });

  it('10. אותה דירה, אבל הוחזקה 12 חודשים — אין פטור, 25% על השבח', () => {
    const r = shevachTax({ ...base, purchaseDate: D('2025-09-22'), isSingleQualifyingHome: true });
    expect(r.exempt).toBe(false);
    expect(r.tax).toBe(Math.round(1_000_000 * SHEVACH.RATE));
  });

  it('11. בעל שתי דירות — אין פטור', () => {
    const r = shevachTax({ ...base, isSingleQualifyingHome: false });
    expect(r.exempt).toBe(false);
    expect(r.tax).toBe(250_000);
  });

  it('12. ניצל פטור לאחרונה — אין פטור', () => {
    const r = shevachTax({ ...base, isSingleQualifyingHome: true, usedExemptionRecently: true });
    expect(r.exempt).toBe(false);
  });

  it('13. מעל התקרה — רק החלק היחסי לעודף חייב', () => {
    const r = shevachTax({ ...base, saleValue: 6_000_000, purchaseValue: 4_000_000, isSingleQualifyingHome: true });
    const excessShare = (6_000_000 - SHEVACH.SINGLE_HOME_EXEMPTION_CEILING) / 6_000_000;
    expect(r.exempt).toBe(false);
    expect(r.tax).toBe(Math.round(2_000_000 * excessShare * SHEVACH.RATE));
  });

  it('14. חישוב לינארי מוטב: דירה שנרכשה ב-2004, נמכרת ב-2026 — כ-45% מהשבח פטור', () => {
    const r = shevachTax({ ...base, purchaseDate: D('2004-01-01'), isSingleQualifyingHome: false });
    expect(r.linearExemptShare).toBeGreaterThan(0.43);
    expect(r.linearExemptShare).toBeLessThan(0.46);
    expect(r.tax).toBe(Math.round(1_000_000 * (1 - r.linearExemptShare) * SHEVACH.RATE));
  });

  it('15. הצמדה למדד והוצאות מוכרות מקטינות את השבח', () => {
    const plain = shevachTax({ ...base, isSingleQualifyingHome: false });
    const adjusted = shevachTax({ ...base, isSingleQualifyingHome: false, cpiFactor: 1.2, deductibleExpenses: 100_000 });
    expect(adjusted.realGain).toBe(3_000_000 - 2_400_000 - 100_000);
    expect(adjusted.tax).toBeLessThan(plain.tax);
  });

  it('16. אין שבח (מכירה בהפסד) — אפס מס, בכל מסלול', () => {
    const r = shevachTax({ ...base, saleValue: 1_800_000, isSingleQualifyingHome: false });
    expect(r.tax).toBe(0);
    expect(r.realGain).toBe(0);
  });

  it('17. נכס מסחרי — 25% על כל השבח, בלי חישוב לינארי ובלי פטור', () => {
    const r = shevachTax({ ...base, assetType: 'shop', purchaseDate: D('2004-01-01'), isSingleQualifyingHome: true });
    expect(r.linearExemptShare).toBe(0);
    expect(r.tax).toBe(250_000);
  });
});

describe('צד בעסקת חליפין', () => {
  const alef = {
    gives: { value: 2_200_000, assetType: 'apartment' as const, purchaseValue: 1_500_000, purchaseDate: D('2016-03-01') },
    receives: { value: 2_600_000, assetType: 'apartment' as const },
    isSingleQualifyingHome: true, willBeSingleHome: true, saleDate: SALE,
  };
  const bet = {
    gives: { value: 2_600_000, assetType: 'apartment' as const, purchaseValue: 1_900_000, purchaseDate: D('2015-01-01') },
    receives: { value: 2_200_000, assetType: 'apartment' as const },
    isSingleQualifyingHome: true, willBeSingleHome: true, saleDate: SALE,
  };

  it('18. הדוגמה מהתוכנית: 2.2 מול 2.6 — יחד כ-33,200 ₪ מס רכישה ואפס שבח', () => {
    const { a, b } = simulateDirectSwap(alef, bet);
    expect(a.purchaseTax.tax + b.purchaseTax.tax).toBeGreaterThanOrEqual(33_000);
    expect(a.purchaseTax.tax + b.purchaseTax.tax).toBeLessThanOrEqual(33_400);
    expect(a.shevach.tax).toBe(0);
    expect(b.shevach.tax).toBe(0);
  });

  it('19. תשלום איזון: א׳ משלם 400 אלף, ב׳ מקבל 400 אלף', () => {
    const { a, b } = simulateDirectSwap(alef, bet);
    expect(a.balancePayment).toBe(400_000);
    expect(b.balancePayment).toBe(-400_000);
  });

  it('20. עמלה 0.5% + מע"מ על הנכס שהצד מסר: 11,000 ו-13,000 כמו במסמך', () => {
    const { a, b } = simulateDirectSwap(alef, bet);
    expect(a.fee.amount).toBe(11_000);
    expect(b.fee.amount).toBe(13_000);
    expect(a.fee.vat).toBe(Math.round(11_000 * VAT_RATE));
    expect(a.fee.rate).toBe(PLATFORM_FEE.STANDARD_RATE);
  });

  it('21. דיווח בזמן — עמלה 0.45%', () => {
    const r = simulateSide({ ...alef, reportsOnTime: true });
    expect(r.fee.rate).toBe(PLATFORM_FEE.ON_TIME_REPORT_RATE);
    expect(r.fee.amount).toBe(9_900);
  });

  it('22. סך המזומן = מסים + עמלה כולל מע"מ + השלמה (רק למי שמשלם)', () => {
    const { a, b } = simulateDirectSwap(alef, bet);
    expect(a.totalCashOut).toBe(a.purchaseTax.tax + a.shevach.tax + a.fee.total + 400_000);
    expect(b.totalCashOut).toBe(b.purchaseTax.tax + b.shevach.tax + b.fee.total);
  });

  it('23. אזהרות: שריפת הפטור, שתי דירות, חכירה, זכויות בנייה, מסחרי, ללא הצמדה', () => {
    const single = simulateSide(alef);
    expect(single.warnings.some((w) => w.includes('פטור דירה יחידה'))).toBe(true);
    expect(single.warnings.some((w) => w.includes('ללא הצמדה'))).toBe(true);

    const investor = simulateSide({ ...alef, isSingleQualifyingHome: false, willBeSingleHome: false,
      gives: { ...alef.gives, rightType: 'lease_rmi', hasUnusedBuildingRights: true, cpiFactor: 1.1 },
      receives: { value: 2_000_000, assetType: 'shop' } });
    const joined = investor.warnings.join(' | ');
    expect(joined).toContain('שתי דירות');
    expect(joined).toContain('חכירה');
    expect(joined).toContain('היטל השבחה');
    expect(joined).toContain('שיעור אחיד');
    expect(joined).not.toContain('ללא הצמדה');
  });

  it('24. כל תוצאה נושאת גרסת כללים', () => {
    expect(simulateSide(alef).rulesVersion).toBe('2026-09');
  });
});
