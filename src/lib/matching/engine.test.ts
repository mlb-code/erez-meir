import { describe, expect, it } from 'vitest';
import {
  cashFlowAllowed,
  cashGap,
  computeMatches,
  describeCycle,
  edgeExists,
  findCycles,
  hasFeature,
  scoreCycle,
  type MatchableListing,
} from './engine';

/** מודעת בסיס — כל בדיקה דורסת רק את מה שרלוונטי לה. */
function listing(overrides: Partial<MatchableListing> = {}): MatchableListing {
  return {
    id: 'base',
    city: 'תל אביב',
    rooms: 3,
    size_sqm: 80,
    asking_value: 4_000_000,
    has_elevator: true,
    has_parking: true,
    has_balcony: true,
    has_safe_room: true,
    condition: 'maintained',
    wanted_cities: ['הרצליה'],
    wanted_min_rooms: 3,
    wanted_max_rooms: 5,
    wanted_min_sqm: 70,
    must_haves: [],
    cash_add_max: 0,
    cash_receive_min: 0,
    ...overrides,
  };
}

// ===========================================================================
//  קשתות — תנאי הסף
// ===========================================================================

describe('edgeExists — תנאי הסף של קשת', () => {
  it('1. יוצר קשת כשכל התנאים מתקיימים', () => {
    const from = listing({ id: 'a' });
    const to = listing({ id: 'b', city: 'הרצליה' });
    expect(edgeExists(from, to)).toBe(true);
  });

  it('2. פוסל כשהעיר לא ברשימת הערים המבוקשות', () => {
    const from = listing({ id: 'a', wanted_cities: ['רעננה'] });
    const to = listing({ id: 'b', city: 'הרצליה' });
    expect(edgeExists(from, to)).toBe(false);
  });

  it('3. פוסל כשמספר החדרים מחוץ לטווח — משני הכיוונים', () => {
    const from = listing({ id: 'a', wanted_min_rooms: 4, wanted_max_rooms: 5 });
    expect(edgeExists(from, listing({ id: 'b', city: 'הרצליה', rooms: 3.5 }))).toBe(false);
    expect(edgeExists(from, listing({ id: 'c', city: 'הרצליה', rooms: 5.5 }))).toBe(false);
    expect(edgeExists(from, listing({ id: 'd', city: 'הרצליה', rooms: 4.5 }))).toBe(true);
  });

  it('4. פוסל כששטח הדירה קטן מהמינימום שהתבקש', () => {
    const from = listing({ id: 'a', wanted_min_sqm: 100 });
    expect(edgeExists(from, listing({ id: 'b', city: 'הרצליה', size_sqm: 99 }))).toBe(false);
    expect(edgeExists(from, listing({ id: 'c', city: 'הרצליה', size_sqm: 100 }))).toBe(true);
  });

  it('5. פוסל כשחסר אחד מהמאפיינים שדרשתי', () => {
    const from = listing({ id: 'a', must_haves: ['elevator', 'parking'] });
    const noParking = listing({ id: 'b', city: 'הרצליה', has_parking: false });
    const hasBoth = listing({ id: 'c', city: 'הרצליה' });
    expect(edgeExists(from, noParking)).toBe(false);
    expect(edgeExists(from, hasBoth)).toBe(true);
  });

  it('6. הדרישה "משופצת" מסופקת גם ע"י דירה חדשה מקבלן', () => {
    expect(hasFeature(listing({ condition: 'renovated' }), 'renovated')).toBe(true);
    expect(hasFeature(listing({ condition: 'new' }), 'renovated')).toBe(true);
    expect(hasFeature(listing({ condition: 'maintained' }), 'renovated')).toBe(false);
    expect(hasFeature(listing({ condition: 'needs_renovation' }), 'renovated')).toBe(false);
  });

  it('7. מודעה אף פעם לא מתאימה לעצמה', () => {
    const self = listing({ id: 'a', city: 'הרצליה', wanted_cities: ['הרצליה'] });
    expect(edgeExists(self, self)).toBe(false);
  });
});

// ===========================================================================
//  פערי מזומן — מקרי הקצה
// ===========================================================================

describe('cashFlowAllowed — גמישות מזומן', () => {
  it('8. פער בדיוק בגובה cash_add_max — עובר (גבול כולל)', () => {
    const from = listing({ id: 'a', asking_value: 4_000_000, cash_add_max: 300_000 });
    const to = listing({ id: 'b', city: 'הרצליה', asking_value: 4_300_000 });
    expect(cashGap(from, to)).toBe(300_000);
    expect(cashFlowAllowed(from, to)).toBe(true);
    expect(edgeExists(from, to)).toBe(true);
  });

  it('9. שקל אחד מעל cash_add_max — נפסל', () => {
    const from = listing({ id: 'a', asking_value: 4_000_000, cash_add_max: 300_000 });
    const to = listing({ id: 'b', city: 'הרצליה', asking_value: 4_300_001 });
    expect(cashFlowAllowed(from, to)).toBe(false);
    expect(edgeExists(from, to)).toBe(false);
  });

  it('10. cash_add_max=0 חוסם כל עלייה בשווי, ולו של שקל', () => {
    const from = listing({ id: 'a', asking_value: 4_000_000, cash_add_max: 0 });
    expect(cashFlowAllowed(from, listing({ id: 'b', city: 'הרצליה', asking_value: 4_000_001 }))).toBe(
      false,
    );
  });

  it('11. השלמה בדיוק בגובה cash_receive_min — עוברת (גבול כולל)', () => {
    const from = listing({ id: 'a', asking_value: 5_000_000, cash_receive_min: 500_000 });
    const to = listing({ id: 'b', city: 'הרצליה', asking_value: 4_500_000 });
    expect(cashGap(from, to)).toBe(-500_000);
    expect(cashFlowAllowed(from, to)).toBe(true);
  });

  it('12. השלמה נמוכה מ-cash_receive_min — נפסלת', () => {
    const from = listing({ id: 'a', asking_value: 5_000_000, cash_receive_min: 500_000 });
    const to = listing({ id: 'b', city: 'הרצליה', asking_value: 4_600_000 });
    expect(cashFlowAllowed(from, to)).toBe(false);
    expect(edgeExists(from, to)).toBe(false);
  });

  it('13. שווי זהה עובר, גם כשהוגדרה דרישת השלמה מינימלית', () => {
    const from = listing({
      id: 'a',
      asking_value: 4_000_000,
      cash_add_max: 0,
      cash_receive_min: 800_000,
    });
    const to = listing({ id: 'b', city: 'הרצליה', asking_value: 4_000_000 });
    expect(cashGap(from, to)).toBe(0);
    expect(cashFlowAllowed(from, to)).toBe(true);
  });

  it('14. שתי הדרישות נבדקות בנפרד לכל צד של העסקה', () => {
    // א׳ מוכן להוסיף עד 200 אלף, ב׳ דורש לקבל לפחות 300 אלף.
    // הדירה של ב׳ יקרה ב-200 אלף — כלומר ב׳ יקבל 200 אלף בלבד. אין עסקה.
    const a = listing({ id: 'a', asking_value: 4_000_000, cash_add_max: 200_000 });
    const b = listing({
      id: 'b',
      city: 'הרצליה',
      asking_value: 4_200_000,
      wanted_cities: ['תל אביב'],
      cash_receive_min: 300_000,
    });
    expect(edgeExists(a, b)).toBe(true);
    expect(edgeExists(b, a)).toBe(false);
    expect(computeMatches([a, b])).toHaveLength(0);
  });
});

// ===========================================================================
//  מעגלים
// ===========================================================================

describe('findCycles — איתור מעגלים', () => {
  it('15. מזהה התאמה ישירה (מעגל של 2)', () => {
    const a = listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'] });
    const b = listing({ id: 'b', city: 'הרצליה', wanted_cities: ['תל אביב'] });

    const matches = computeMatches([a, b]);
    expect(matches).toHaveLength(1);
    expect(matches[0].match_type).toBe('direct');
    expect(matches[0].chain_listing_ids).toEqual(['a', 'b']);
  });

  it('16. קשת חד-כיוונית לא מייצרת התאמה', () => {
    const a = listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'] });
    const b = listing({ id: 'b', city: 'הרצליה', wanted_cities: ['רעננה'] });
    expect(computeMatches([a, b])).toHaveLength(0);
  });

  it('17. מזהה שרשרת של 3, ומנרמל אותה כך שהמזהה הקטן ביותר ראשון', () => {
    // המעגל שנבנה הוא b → c → a → b. הנרמול אמור להחזיר [a, b, c].
    const b = listing({ id: 'b', city: 'תל אביב', wanted_cities: ['הרצליה'] });
    const c = listing({ id: 'c', city: 'הרצליה', wanted_cities: ['רמת גן'] });
    const a = listing({ id: 'a', city: 'רמת גן', wanted_cities: ['תל אביב'] });

    const cycles = findCycles([b, c, a]);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toEqual(['a', 'b', 'c']);

    const matches = computeMatches([b, c, a]);
    expect(matches[0].match_type).toBe('chain');
  });

  it('18. מזהה שרשרת של 4', () => {
    const l1 = listing({ id: 'l1', city: 'תל אביב', wanted_cities: ['גבעתיים'] });
    const l2 = listing({ id: 'l2', city: 'גבעתיים', wanted_cities: ['פתח תקווה'] });
    const l3 = listing({ id: 'l3', city: 'פתח תקווה', wanted_cities: ['ראשון לציון'] });
    const l4 = listing({ id: 'l4', city: 'ראשון לציון', wanted_cities: ['תל אביב'] });

    const matches = computeMatches([l1, l2, l3, l4]);
    expect(matches).toHaveLength(1);
    expect(matches[0].chain_listing_ids).toEqual(['l1', 'l2', 'l3', 'l4']);
    expect(matches[0].match_type).toBe('chain');
  });

  it('19. לא מחזיר מעגל ארוך ממגבלת האורך, אבל כן מעגל שסוגר בדיוק במגבלה', () => {
    const l1 = listing({ id: 'l1', city: 'תל אביב', wanted_cities: ['גבעתיים'] });
    const l2 = listing({ id: 'l2', city: 'גבעתיים', wanted_cities: ['פתח תקווה'] });
    const l3 = listing({ id: 'l3', city: 'פתח תקווה', wanted_cities: ['ראשון לציון'] });
    const l4 = listing({ id: 'l4', city: 'ראשון לציון', wanted_cities: ['תל אביב'] });
    const all = [l1, l2, l3, l4];

    expect(findCycles(all, 4)).toHaveLength(1); // סוגר בדיוק במגבלה
    expect(findCycles(all, 3)).toHaveLength(0); // ארוך מהמותר
  });

  it('20. לא מחזיר את אותו מעגל פעמיים, גם כשיש כמה נקודות פתיחה אפשריות', () => {
    const l1 = listing({ id: 'l1', city: 'תל אביב', wanted_cities: ['גבעתיים'] });
    const l2 = listing({ id: 'l2', city: 'גבעתיים', wanted_cities: ['פתח תקווה'] });
    const l3 = listing({ id: 'l3', city: 'פתח תקווה', wanted_cities: ['תל אביב'] });

    const cycles = findCycles([l1, l2, l3]);
    const keys = new Set(cycles.map((cycle) => cycle.join('>')));
    expect(cycles).toHaveLength(1);
    expect(keys.size).toBe(1);
  });

  it('21. שני כיווני מעבר של אותה שלישייה נחשבים לשתי התאמות נפרדות', () => {
    // כל אחד מהשלושה רוצה את שתי הערים האחרות — לכן קיים מעגל בכל כיוון.
    const l1 = listing({ id: 'l1', city: 'תל אביב', wanted_cities: ['גבעתיים', 'פתח תקווה'] });
    const l2 = listing({ id: 'l2', city: 'גבעתיים', wanted_cities: ['תל אביב', 'פתח תקווה'] });
    const l3 = listing({ id: 'l3', city: 'פתח תקווה', wanted_cities: ['תל אביב', 'גבעתיים'] });

    const chains = computeMatches([l1, l2, l3]).filter((m) => m.match_type === 'chain');
    expect(chains).toHaveLength(2);
    expect(new Set(chains.map((c) => c.chain_listing_ids.join('>')))).toEqual(
      new Set(['l1>l2>l3', 'l1>l3>l2']),
    );
  });
});

// ===========================================================================
//  ציון
// ===========================================================================

describe('scoreCycle — חישוב הציון', () => {
  it('22. התאמה ישירה מקבלת ציון גבוה משרשרת בעלת אותם נתונים', () => {
    const perfect = { asking_value: 4_000_000, rooms: 3, size_sqm: 80, wanted_min_sqm: 80 };

    const a = listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'], ...perfect });
    const b = listing({ id: 'b', city: 'הרצליה', wanted_cities: ['תל אביב'], ...perfect });
    expect(scoreCycle([a, b])).toBe(87); // 50 בסיס + 25 קרבת שווי + 0 עודף + 12 בונוס ישיר

    const c1 = listing({ id: 'c1', city: 'תל אביב', wanted_cities: ['גבעתיים'], ...perfect });
    const c2 = listing({ id: 'c2', city: 'גבעתיים', wanted_cities: ['רעננה'], ...perfect });
    const c3 = listing({ id: 'c3', city: 'רעננה', wanted_cities: ['תל אביב'], ...perfect });
    expect(scoreCycle([c1, c2, c3])).toBe(69); // אותו דבר, פחות 6 על החוליה הנוספת
  });

  it('23. פער מזומן גדול מוריד את הציון, וכל ציון נשאר בטווח 0–100', () => {
    const close = [
      listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'], asking_value: 4_000_000, cash_add_max: 1_000_000 }),
      listing({ id: 'b', city: 'הרצליה', wanted_cities: ['תל אביב'], asking_value: 4_050_000 }),
    ];
    const far = [
      listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'], asking_value: 4_000_000, cash_add_max: 1_000_000 }),
      listing({ id: 'b', city: 'הרצליה', wanted_cities: ['תל אביב'], asking_value: 4_900_000 }),
    ];

    expect(scoreCycle(close)).toBeGreaterThan(scoreCycle(far));
    for (const score of [scoreCycle(close), scoreCycle(far)]) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('24. עודף על הקריטריונים מעלה את הציון', () => {
    const modest = [
      listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'], wanted_min_rooms: 3, wanted_min_sqm: 80 }),
      listing({ id: 'b', city: 'הרצליה', wanted_cities: ['תל אביב'], rooms: 3, size_sqm: 80, wanted_min_rooms: 3, wanted_min_sqm: 80 }),
    ];
    const generous = [
      listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'], wanted_min_rooms: 3, wanted_min_sqm: 80 }),
      listing({ id: 'b', city: 'הרצליה', wanted_cities: ['תל אביב'], rooms: 4.5, size_sqm: 120, wanted_min_rooms: 3, wanted_min_sqm: 80 }),
    ];
    expect(scoreCycle(generous)).toBeGreaterThan(scoreCycle(modest));
  });

  it('25. ההתאמות מוחזרות ממוינות לפי ציון יורד', () => {
    const l1 = listing({ id: 'l1', city: 'תל אביב', wanted_cities: ['גבעתיים', 'הרצליה'], cash_add_max: 2_000_000 });
    const l2 = listing({ id: 'l2', city: 'גבעתיים', wanted_cities: ['תל אביב'], asking_value: 4_800_000 });
    const l3 = listing({ id: 'l3', city: 'הרצליה', wanted_cities: ['תל אביב'], asking_value: 4_020_000 });

    const scores = computeMatches([l1, l2, l3]).map((m) => m.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

// ===========================================================================
//  תיאור המעגל לתצוגה
// ===========================================================================

describe('describeCycle — תנועות הכסף בשרשרת', () => {
  it('26. מחזיר לכל מעבר מי עובר לאן וכמה כסף עובר', () => {
    const a = listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'], asking_value: 4_000_000 });
    const b = listing({ id: 'b', city: 'הרצליה', wanted_cities: ['תל אביב'], asking_value: 4_300_000 });

    const steps = describeCycle([a, b]);
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ cash: 300_000 });
    expect(steps[0].from.id).toBe('a');
    expect(steps[0].to.id).toBe('b');
    expect(steps[1]).toMatchObject({ cash: -300_000 });
    expect(steps[1].from.id).toBe('b');
    expect(steps[1].to.id).toBe('a');
  });
});
