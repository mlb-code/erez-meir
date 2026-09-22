import { describe, expect, it } from 'vitest';
import { scanForBypass, transactionMatchesListing, type Exposure, type PublicTransaction, type ScannedListing } from './scan';

const D = (s: string) => new Date(s);
const NOW = D('2026-09-22');

const L = (id: string, extra: Partial<ScannedListing> = {}): ScannedListing =>
  ({ id, gush: 6111, helka: 42, tat_helka: 7, city: 'תל אביב', street: 'ארלוזורוב', house_number: '12', ...extra });
const TX = (id: number, extra: Partial<PublicTransaction> = {}): PublicTransaction =>
  ({ id, gush: 6111, helka: 42, tat_helka: 7, city: 'תל אביב', street: 'ארלוזורוב', house_number: '12', sale_date: D('2026-06-01'), price: 4_000_000, ...extra });
const EXP = (listing_id: string, match_id = 'm1', ids = ['a', 'b'], at = D('2026-03-01')): Exposure =>
  ({ listing_id, match_id, first_exposed_at: at, match_listing_ids: ids });

describe('זיהוי עסקה ↔ נכס', () => {
  it('1. גוש+חלקה+תת-חלקה זהים — התאמה לפי חלקה', () => {
    expect(transactionMatchesListing(TX(1), L('a'))).toBe('gush_helka');
  });
  it('2. תת-חלקה שונה — לא אותו נכס', () => {
    expect(transactionMatchesListing(TX(1, { tat_helka: 8 }), L('a'))).toBeNull();
  });
  it('3. תת-חלקה חסרה באחד הצדדים — מספיק גוש+חלקה', () => {
    expect(transactionMatchesListing(TX(1, { tat_helka: null }), L('a'))).toBe('gush_helka');
  });
  it('4. בלי חלקה — נופלים לכתובת מלאה, עם נרמול גרשיים ורווחים', () => {
    expect(transactionMatchesListing(TX(1, { gush: null, helka: null, street: 'ארלוזורוב ', house_number: '12' }), L('a', { gush: null, helka: null }))).toBe('address');
    expect(transactionMatchesListing(TX(1, { gush: null, helka: null, house_number: '14' }), L('a', { gush: null, helka: null }))).toBeNull();
  });
});

describe('הסורק', () => {
  it('5. עסקה אחרי החשיפה על נכס שנחשף — התראה', () => {
    const r = scanForBypass([L('a'), L('b', { gush: 7000 })], [EXP('a')], [TX(1)], [], NOW);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ listing_id: 'a', match_id: 'm1', public_transaction_id: 1, matched_by: 'gush_helka', reported_closing: false });
  });
  it('6. עסקה לפני החשיפה — לא רלוונטית', () => {
    const r = scanForBypass([L('a')], [EXP('a')], [TX(1, { sale_date: D('2026-01-15') })], [], NOW);
    expect(r).toHaveLength(0);
  });
  it('7. חשיפה ישנה מ-24 חודשים — מחוץ לניטור', () => {
    const r = scanForBypass([L('a')], [EXP('a', 'm1', ['a', 'b'], D('2024-01-01'))], [TX(1)], [], NOW);
    expect(r).toHaveLength(0);
  });
  it('8. הצד השני במעגל מכר בסמוך — חשד מוגבר', () => {
    const listings = [L('a'), L('b', { gush: 7000, helka: 5, tat_helka: 1 })];
    const txs = [TX(1), TX(2, { gush: 7000, helka: 5, tat_helka: 1, sale_date: D('2026-06-20') })];
    const r = scanForBypass(listings, [EXP('a'), EXP('b')], txs, [], NOW);
    expect(r).toHaveLength(2);
    expect(r.every((x) => x.counterpart_also_sold)).toBe(true);
  });
  it('9. הצד השני מכר, אבל שנה אחרי — לא נחשב "בסמוך"', () => {
    const listings = [L('a'), L('b', { gush: 7000, helka: 5, tat_helka: 1 })];
    const txs = [TX(1), TX(2, { gush: 7000, helka: 5, tat_helka: 1, sale_date: D('2027-06-20') })];
    const r = scanForBypass(listings, [EXP('a')], txs, [], NOW);
    expect(r[0].counterpart_also_sold).toBe(false);
  });
  it('10. סגירה שדווחה — האירוע מסומן כדיווח, לא כחשד', () => {
    const r = scanForBypass([L('a')], [EXP('a')], [TX(1)], [{ listing_id: 'a', match_id: 'm1' }], NOW);
    expect(r[0].reported_closing).toBe(true);
  });
  it('11. אותה עסקה לא מדווחת פעמיים לאותו נכס גם אם נחשף בשני מעגלים', () => {
    const r = scanForBypass([L('a')], [EXP('a', 'm1'), EXP('a', 'm2', ['a', 'c'])], [TX(1)], [], NOW);
    expect(r).toHaveLength(1);
  });
});
