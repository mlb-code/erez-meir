import { describe, expect, it } from 'vitest';
import {
  cashFlowAllowed,
  cashGap,
  computeMatches,
  describeCycle,
  edgeExists,
  eligible,
  estimateCloseProbability,
  findCycles,
  hasFeature,
  scoreCycle,
  sideScore,
  timeFit,
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
    // צד: 20 בסיס + 25 קרבת שווי + 0 עודף + 5 זמן (ניטרלי) + 10 רכות (ניטרלי) + 10 נקי משפטית = 70
    expect(scoreCycle([a, b]).score).toBe(78); // 70 + 8 בונוס ישיר

    const c1 = listing({ id: 'c1', city: 'תל אביב', wanted_cities: ['גבעתיים'], ...perfect });
    const c2 = listing({ id: 'c2', city: 'גבעתיים', wanted_cities: ['רעננה'], ...perfect });
    const c3 = listing({ id: 'c3', city: 'רעננה', wanted_cities: ['תל אביב'], ...perfect });
    expect(scoreCycle([c1, c2, c3]).score).toBe(65); // 70 − 5 על החוליה הנוספת
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

    expect(scoreCycle(close).score).toBeGreaterThan(scoreCycle(far).score);
    for (const score of [scoreCycle(close).score, scoreCycle(far).score]) {
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
    // ב-v2 ציון המעגל הוא החוליה החלשה, ולכן העודף משתקף בציון הצד של א׳ — לא בהכרח בציון המעגל.
    expect(sideScore(generous[0], generous[1])).toBeGreaterThan(sideScore(modest[0], modest[1]));
    expect(scoreCycle(generous).scores.a).toBeGreaterThan(scoreCycle(modest).scores.a);
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

// ===========================================================================
//  מנוע v2 — סוג נכס, שכונות, קומה, משפטי, טווח שווי, זמן, נעילה, ציון לכל צד
// ===========================================================================

describe('v2 — מסננים קשיחים חדשים', () => {
  const pair = (fromExtra: Partial<MatchableListing>, toExtra: Partial<MatchableListing>) => [
    listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'], ...fromExtra }),
    listing({ id: 'b', city: 'הרצליה', ...toExtra }),
  ] as const;

  it('27. סוג נכס: מי שמחפש דירה לא מקבל חנות, ולהפך', () => {
    let [a, b] = pair({}, { asset_type: 'shop' });
    expect(edgeExists(a, b)).toBe(false);
    [a, b] = pair({ wanted_asset_types: ['shop', 'office'] }, { asset_type: 'shop' });
    expect(edgeExists(a, b)).toBe(true);
    [a, b] = pair({ wanted_asset_types: ['shop'] }, { asset_type: 'apartment' });
    expect(edgeExists(a, b)).toBe(false);
  });

  it('28. שכונות: כשהוגדרו — רק נכס באחת מהן עובר; כשלא — כל העיר', () => {
    let [a, b] = pair({ wanted_neighborhood_ids: ['n1', 'n2'] }, { neighborhood_id: 'n3' });
    expect(edgeExists(a, b)).toBe(false);
    [a, b] = pair({ wanted_neighborhood_ids: ['n1', 'n2'] }, { neighborhood_id: 'n2' });
    expect(edgeExists(a, b)).toBe(true);
    [a, b] = pair({ wanted_neighborhood_ids: [] }, { neighborhood_id: 'n9' });
    expect(edgeExists(a, b)).toBe(true);
  });

  it('29. לקרקע אין חדרים — מסנן החדרים לא חל עליה', () => {
    const [a, b] = pair({ wanted_asset_types: ['land'], wanted_min_rooms: 4, wanted_min_sqm: 300 },
                        { asset_type: 'land', rooms: 0, size_sqm: 500 });
    expect(edgeExists(a, b)).toBe(true);
  });

  it('30. קומה מינימלית: קומת קרקע (null) נחשבת 0', () => {
    let [a, b] = pair({ wanted_min_floor: 2 }, { floor: null });
    expect(edgeExists(a, b)).toBe(false);
    [a, b] = pair({ wanted_min_floor: 2 }, { floor: 2 });
    expect(edgeExists(a, b)).toBe(true);
  });

  it('31. "ללא שוכר" ו"ללא הערות אזהרה" הם תנאי סף', () => {
    let [a, b] = pair({ must_haves: ['no_tenant'] }, { has_tenant: true });
    expect(edgeExists(a, b)).toBe(false);
    [a, b] = pair({ must_haves: ['no_caveats'] }, { has_liens: true });
    expect(edgeExists(a, b)).toBe(false);
    [a, b] = pair({ must_haves: ['no_tenant', 'no_caveats'] }, { has_tenant: false, has_caveats: false });
    expect(edgeExists(a, b)).toBe(true);
  });

  it('32. טווח שווי מבוקש נבדק בנוסף לגמישות המזומן', () => {
    let [a, b] = pair({ wanted_value_max: 3_500_000, cash_add_max: 1_000_000 }, { asking_value: 4_000_000 });
    expect(edgeExists(a, b)).toBe(false);          // המזומן מרשה, הטווח לא
    [a, b] = pair({ wanted_value_min: 3_000_000 }, { asking_value: 2_900_000 });
    expect(edgeExists(a, b)).toBe(false);
    [a, b] = pair({ wanted_value_min: 3_000_000, wanted_value_max: 4_500_000, cash_add_max: 500_000 }, { asking_value: 4_400_000 });
    expect(edgeExists(a, b)).toBe(true);
  });

  it('33. זמן: חלונות שלא נחפפים חוסמים; גמישות של הנכס פותרת; חלון חסר = לא נבדק', () => {
    const want = { wanted_available_from: '2027-01-01', wanted_available_until: '2027-03-31' };
    let [a, b] = pair(want, { available_from: '2027-05-01', available_until: '2027-06-30' });
    expect(timeFit(a, b)).toBe(0);
    expect(edgeExists(a, b)).toBe(false);
    [a, b] = pair(want, { available_from: '2027-05-01', available_until: '2027-06-30', availability_flex_months: 2 });
    expect(edgeExists(a, b)).toBe(true);
    [a, b] = pair(want, {});
    expect(timeFit(a, b)).toBeNull();
    expect(edgeExists(a, b)).toBe(true);
    [a, b] = pair(want, { available_from: '2027-01-01', available_until: '2027-03-31' });
    expect(timeFit(a, b)).toBe(1);
  });

  it('34. שני נכסים של אותו בעלים לא מתאימים זה לזה', () => {
    const [a, b] = pair({ owner_id: 'u1' }, { owner_id: 'u1', wanted_cities: ['תל אביב'] });
    expect(edgeExists(a, b)).toBe(false);
    expect(computeMatches([a, b])).toHaveLength(0);
  });

  it('35. נכס נעול (במו"מ בלעדי) לא משתתף במנוע; נעילה שפגה — כן', () => {
    const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const a = listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'] });
    expect(eligible([a, listing({ id: 'b', city: 'הרצליה', wanted_cities: ['תל אביב'], locked_until: future })])).toHaveLength(1);
    expect(computeMatches([a, listing({ id: 'b', city: 'הרצליה', wanted_cities: ['תל אביב'], locked_until: future })])).toHaveLength(0);
    expect(computeMatches([a, listing({ id: 'b', city: 'הרצליה', wanted_cities: ['תל אביב'], locked_until: past })])).toHaveLength(1);
  });
});

describe('v2 — ציון לכל צד והסתברות סגירה', () => {
  it('36. ההתאמה א-סימטרית: לכל צד ציון משלו, וציון המעגל הוא החוליה החלשה', () => {
    const a = listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'], asking_value: 4_000_000, cash_add_max: 1_000_000,
      soft_prefs: { parking: 3, elevator: 3 } });
    const b = listing({ id: 'b', city: 'הרצליה', wanted_cities: ['תל אביב'], asking_value: 4_500_000,
      has_parking: false, has_elevator: false, has_tenant: true });
    const m = computeMatches([a, b])[0];
    expect(m.scores.a).toBeLessThan(m.scores.b);           // א׳ מקבל דירה בלי מה שביקש, עם שוכר, ומשלם
    expect(m.score).toBe(Math.min(m.scores.a, m.scores.b) + 8);
  });

  it('37. העדפות רכות שמתקיימות מעלות את הציון, ושלא מתקיימות מורידות', () => {
    const base = listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'] });
    const hit = listing({ id: 'b', city: 'הרצליה', has_balcony: true, building_year: 2024 });
    const miss = listing({ id: 'c', city: 'הרצליה', has_balcony: false, building_year: 1970 });
    const neutral = sideScore(base, hit);
    const wants = { ...base, soft_prefs: { balcony: 3, new_building: 2 } as const };
    expect(sideScore(wants, hit)).toBeGreaterThan(neutral);
    expect(sideScore(wants, miss)).toBeLessThan(neutral);
  });

  it('38. ניקיון משפטי: משכנתא קנס קטן, עיקול קנס גדול', () => {
    const a = listing({ id: 'a', city: 'תל אביב', wanted_cities: ['הרצליה'] });
    const clean = sideScore(a, listing({ id: 'b', city: 'הרצליה' }));
    const mortgage = sideScore(a, listing({ id: 'b', city: 'הרצליה', has_mortgage: true }));
    const liens = sideScore(a, listing({ id: 'b', city: 'הרצליה', has_liens: true }));
    expect(clean - mortgage).toBe(2);
    expect(clean - liens).toBe(8);
  });

  it('39. הסתברות סגירה: בטווח, יורדת עם אורך המעגל, עולה כשכולם מאומתים', () => {
    const mk = (id: string, city: string, want: string, verified = false) =>
      listing({ id, city, wanted_cities: [want], identity_verified: verified });
    const direct = computeMatches([mk('a', 'תל אביב', 'הרצליה'), mk('b', 'הרצליה', 'תל אביב')])[0];
    const chain = computeMatches([mk('a', 'תל אביב', 'הרצליה'), mk('b', 'הרצליה', 'רעננה'), mk('c', 'רעננה', 'תל אביב')])[0];
    const verified = computeMatches([mk('a', 'תל אביב', 'הרצליה', true), mk('b', 'הרצליה', 'תל אביב', true)])[0];
    for (const m of [direct, chain, verified]) {
      expect(m.estimated_close_probability).toBeGreaterThanOrEqual(0.02);
      expect(m.estimated_close_probability).toBeLessThanOrEqual(0.95);
    }
    expect(chain.estimated_close_probability).toBeLessThan(direct.estimated_close_probability);
    expect(verified.estimated_close_probability).toBeGreaterThan(direct.estimated_close_probability);
    expect(estimateCloseProbability([], { x: 100 })).toBeLessThanOrEqual(0.95);
  });

  it('40. הסינון המקדים לפי עיר לא מפספס מעגל בין ערים שונות', () => {
    const l = [
      listing({ id: 'a', city: 'תל אביב', wanted_cities: ['גבעתיים'] }),
      listing({ id: 'b', city: 'גבעתיים', wanted_cities: ['פתח תקווה'] }),
      listing({ id: 'c', city: 'פתח תקווה', wanted_cities: ['ראשון לציון'] }),
      listing({ id: 'd', city: 'ראשון לציון', wanted_cities: ['תל אביב'] }),
      listing({ id: 'e', city: 'רעננה', wanted_cities: ['רעננה'] }),   // רעש — אף אחד לא רוצה
    ];
    const m = computeMatches(l);
    expect(m).toHaveLength(1);
    expect(m[0].chain_listing_ids).toEqual(['a', 'b', 'c', 'd']);
    expect(Object.keys(m[0].scores).sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});
