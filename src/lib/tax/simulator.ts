import type { AssetType } from '@/lib/types';
import {
  PLATFORM_FEE, PURCHASE_TAX_ADDITIONAL_HOME, PURCHASE_TAX_NON_RESIDENTIAL_RATE,
  PURCHASE_TAX_SINGLE_HOME, RULES_VERSION, SHEVACH, VAT_RATE, type Bracket,
} from './rules-2026';

/**
 * ===========================================================================
 *  סימולטור מס — אומדן בלבד, אינו ייעוץ מס.
 *  עסקת חליפין בישראל = שתי מכירות. לכל צד: מס רכישה על הנכס שהוא מקבל,
 *  מס שבח על הנכס שהוא מוסר, תשלום איזון, ועמלת הפלטפורמה.
 * ===========================================================================
 */

export const RESIDENTIAL_TYPES: ReadonlySet<AssetType> = new Set(['apartment', 'penthouse', 'garden_apartment', 'house']);

export function isResidential(assetType: AssetType): boolean {
  return RESIDENTIAL_TYPES.has(assetType);
}

// ---------------------------------------------------------------------------
//  מס רכישה
// ---------------------------------------------------------------------------

export interface PurchaseTaxInput {
  /** שווי השוק המלא של הנכס המתקבל. */
  value: number;
  assetType: AssetType;
  /** האם לרוכש זו תהיה דירתו היחידה (אחרי מסירת הדירה שהוא מוסר). */
  isSingleHome: boolean;
}

export interface BracketLine { from: number; to: number; rate: number; tax: number }

export interface PurchaseTaxResult {
  tax: number;
  effectiveRate: number;
  track: 'single_home' | 'additional_home' | 'non_residential';
  lines: BracketLine[];
}

function applyBrackets(value: number, brackets: Bracket[]): BracketLine[] {
  const lines: BracketLine[] = [];
  let from = 0;
  for (const bracket of brackets) {
    if (value <= from) break;
    const to = bracket.upTo === null ? value : Math.min(bracket.upTo, value);
    lines.push({ from, to, rate: bracket.rate, tax: (to - from) * bracket.rate });
    from = to;
    if (bracket.upTo === null || value <= bracket.upTo) break;
  }
  return lines;
}

export function purchaseTax(input: PurchaseTaxInput): PurchaseTaxResult {
  if (!isResidential(input.assetType)) {
    const tax = input.value * PURCHASE_TAX_NON_RESIDENTIAL_RATE;
    return {
      tax: Math.round(tax), effectiveRate: PURCHASE_TAX_NON_RESIDENTIAL_RATE, track: 'non_residential',
      lines: [{ from: 0, to: input.value, rate: PURCHASE_TAX_NON_RESIDENTIAL_RATE, tax }],
    };
  }
  const brackets = input.isSingleHome ? PURCHASE_TAX_SINGLE_HOME : PURCHASE_TAX_ADDITIONAL_HOME;
  const lines = applyBrackets(input.value, brackets);
  const tax = lines.reduce((sum, line) => sum + line.tax, 0);
  return {
    tax: Math.round(tax),
    effectiveRate: input.value > 0 ? tax / input.value : 0,
    track: input.isSingleHome ? 'single_home' : 'additional_home',
    lines,
  };
}

// ---------------------------------------------------------------------------
//  מס שבח
// ---------------------------------------------------------------------------

export interface ShevachInput {
  /** שווי המכירה = השווי המוצהר של הנכס שהצד מוסר. */
  saleValue: number;
  assetType: AssetType;
  /** שווי הרכישה המקורי (ללא הצמדה). */
  purchaseValue: number;
  purchaseDate: Date;
  /** מועד החליפין (ברירת מחדל: היום). */
  saleDate?: Date;
  /** מקדם הצמדה למדד מיום הרכישה (1 = ללא הצמדה). */
  cpiFactor?: number;
  /** הוצאות מוכרות: מס רכישה ששולם, שכ"ט עו"ד, תיווך, שיפוצים. */
  deductibleExpenses?: number;
  /** דירת מגורים מזכה ויחידה של המוכר. */
  isSingleQualifyingHome: boolean;
  /** האם המוכר ניצל פטור דירה יחידה ב-18 החודשים האחרונים. */
  usedExemptionRecently?: boolean;
}

export interface ShevachResult {
  tax: number;
  /** השבח הריאלי (אחרי הצמדה והוצאות), לפני פטורים. */
  realGain: number;
  taxableGain: number;
  exempt: boolean;
  exemptionReason: string | null;
  /** חלק השבח שפטור לפי החישוב הלינארי (לפני 1.1.2014). */
  linearExemptShare: number;
  holdingMonths: number;
}

const MS_PER_DAY = 86_400_000;
const monthsBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / MS_PER_DAY / 30.4375;

export function shevachTax(input: ShevachInput): ShevachResult {
  const saleDate = input.saleDate ?? new Date();
  const cpi = input.cpiFactor ?? 1;
  const holdingMonths = Math.max(0, monthsBetween(input.purchaseDate, saleDate));
  const realGain = Math.max(0, input.saleValue - input.purchaseValue * cpi - (input.deductibleExpenses ?? 0));

  // חישוב לינארי מוטב: חלק התקופה שלפני 1.1.2014 פטור
  const totalDays = Math.max(1, (saleDate.getTime() - input.purchaseDate.getTime()) / MS_PER_DAY);
  const exemptDays = Math.max(0, Math.min(totalDays, (SHEVACH.LINEAR_EXEMPT_UNTIL.getTime() - input.purchaseDate.getTime()) / MS_PER_DAY));
  const linearExemptShare = isResidential(input.assetType) ? exemptDays / totalDays : 0;

  const base = { realGain, holdingMonths, linearExemptShare };

  if (realGain === 0) {
    return { ...base, tax: 0, taxableGain: 0, exempt: true, exemptionReason: 'אין שבח — שווי המכירה אינו עולה על שווי הרכישה הצמוד וההוצאות' };
  }

  if (
    isResidential(input.assetType) && input.isSingleQualifyingHome
    && holdingMonths >= SHEVACH.SINGLE_HOME_MIN_HOLDING_MONTHS && !input.usedExemptionRecently
  ) {
    if (input.saleValue <= SHEVACH.SINGLE_HOME_EXEMPTION_CEILING) {
      return { ...base, tax: 0, taxableGain: 0, exempt: true, exemptionReason: 'פטור דירה יחידה (סעיף 49ב(2))' };
    }
    // מעל התקרה: חלק השבח שיחסי לעודף חייב, לפי החישוב הלינארי
    const excessShare = (input.saleValue - SHEVACH.SINGLE_HOME_EXEMPTION_CEILING) / input.saleValue;
    const taxableGain = realGain * excessShare * (1 - linearExemptShare);
    return {
      ...base, tax: Math.round(taxableGain * SHEVACH.RATE), taxableGain, exempt: false,
      exemptionReason: `פטור דירה יחידה עד התקרה (${SHEVACH.SINGLE_HOME_EXEMPTION_CEILING.toLocaleString('en-US')} ₪); העודף חייב`,
    };
  }

  const taxableGain = realGain * (1 - linearExemptShare);
  return { ...base, tax: Math.round(taxableGain * SHEVACH.RATE), taxableGain, exempt: false, exemptionReason: null };
}

// ---------------------------------------------------------------------------
//  צד אחד בעסקת חליפין
// ---------------------------------------------------------------------------

export interface SideInput {
  /** הנכס שהצד מוסר. */
  gives: { value: number; assetType: AssetType; purchaseValue: number; purchaseDate: Date;
           cpiFactor?: number; deductibleExpenses?: number; rightType?: 'ownership' | 'lease_rmi' | 'housing_company';
           hasUnusedBuildingRights?: boolean };
  /** הנכס שהצד מקבל. */
  receives: { value: number; assetType: AssetType };
  /** המוכר: דירה יחידה מזכה? הוחזקה ≥18 חודשים נגזר מהתאריכים. */
  isSingleQualifyingHome: boolean;
  /** אחרי העסקה — האם הנכס שמתקבל יהיה דירתו היחידה (רלוונטי לדירת מגורים בלבד). */
  willBeSingleHome: boolean;
  usedExemptionRecently?: boolean;
  /** האם הצד ידווח על החתימה בזמן (עמלה 0.45%). */
  reportsOnTime?: boolean;
  saleDate?: Date;
}

export interface SideResult {
  purchaseTax: PurchaseTaxResult;
  shevach: ShevachResult;
  /** חיובי = הצד משלם השלמה, שלילי = מקבל. */
  balancePayment: number;
  fee: { rate: number; base: number; amount: number; vat: number; total: number };
  /** סך העלות במזומן של הצד: מסים + עמלה + השלמה (אם משלם). */
  totalCashOut: number;
  warnings: string[];
  rulesVersion: string;
}

export function simulateSide(input: SideInput): SideResult {
  const purchase = purchaseTax({ value: input.receives.value, assetType: input.receives.assetType, isSingleHome: input.willBeSingleHome });
  const shevach = shevachTax({
    saleValue: input.gives.value, assetType: input.gives.assetType, purchaseValue: input.gives.purchaseValue,
    purchaseDate: input.gives.purchaseDate, saleDate: input.saleDate, cpiFactor: input.gives.cpiFactor,
    deductibleExpenses: input.gives.deductibleExpenses, isSingleQualifyingHome: input.isSingleQualifyingHome,
    usedExemptionRecently: input.usedExemptionRecently,
  });
  const balancePayment = input.receives.value - input.gives.value;

  const rate = input.reportsOnTime ? PLATFORM_FEE.ON_TIME_REPORT_RATE : PLATFORM_FEE.STANDARD_RATE;
  const feeAmount = Math.round(input.gives.value * rate);
  const vat = Math.round(feeAmount * VAT_RATE);
  const fee = { rate, base: input.gives.value, amount: feeAmount, vat, total: feeAmount + vat };

  const warnings: string[] = [];
  if (shevach.exempt && shevach.exemptionReason?.startsWith('פטור דירה יחידה')) {
    warnings.push(`שימוש בפטור דירה יחידה עכשיו מונע שימוש חוזר בו ב-${SHEVACH.EXEMPTION_COOLDOWN_MONTHS} החודשים הבאים`);
  }
  if (isResidential(input.gives.assetType) && !input.isSingleQualifyingHome) {
    warnings.push('בעל שתי דירות ומעלה אינו זכאי לפטור ממס שבח, ומשלם מס רכישה של דירה נוספת');
  }
  if (isResidential(input.gives.assetType) && input.isSingleQualifyingHome && shevach.holdingMonths < SHEVACH.SINGLE_HOME_MIN_HOLDING_MONTHS) {
    warnings.push(`הדירה הוחזקה פחות מ-${SHEVACH.SINGLE_HOME_MIN_HOLDING_MONTHS} חודשים — אין זכאות לפטור דירה יחידה`);
  }
  if (input.gives.rightType === 'lease_rmi') warnings.push('נכס בחכירה מרשות מקרקעי ישראל — ייתכנו דמי הסכמה או היוון');
  if (input.gives.hasUnusedBuildingRights) warnings.push('זכויות בנייה לא מנוצלות — ייתכן היטל השבחה לוועדה המקומית');
  if (!isResidential(input.receives.assetType)) warnings.push('נכס שאינו דירת מגורים — מס רכישה בשיעור אחיד, ללא מדרגות דירה יחידה');
  if (!isResidential(input.gives.assetType)) warnings.push('מכירת נכס שאינו דירת מגורים — אין פטור ממס שבח');
  if (input.gives.cpiFactor === undefined) warnings.push('השבח חושב ללא הצמדה למדד — האומדן שמרני (מס גבוה מהצפוי)');

  const totalCashOut = purchase.tax + shevach.tax + fee.total + Math.max(0, balancePayment);
  return { purchaseTax: purchase, shevach, balancePayment, fee, totalCashOut, warnings, rulesVersion: RULES_VERSION };
}

/** נוחות: שני צדדים של החלפה ישירה. */
export function simulateDirectSwap(a: SideInput, b: SideInput): { a: SideResult; b: SideResult } {
  return { a: simulateSide(a), b: simulateSide(b) };
}
