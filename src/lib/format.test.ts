import { describe, expect, it } from 'vitest';
import { formatCurrency, formatRooms } from './format';

describe('formatCurrency', () => {
  it('מציג מיליונים בצורה קריאה', () => {
    expect(formatCurrency(4_500_000)).toBe('4.5 מיליון ₪');
    expect(formatCurrency(4_000_000)).toBe('4 מיליון ₪');
    expect(formatCurrency(1_100_000)).toBe('1.1 מיליון ₪');
    expect(formatCurrency(10_000_000)).toBe('10 מיליון ₪');
  });

  it('מציג אלפים בלי לאבד אפסים', () => {
    expect(formatCurrency(200_000)).toBe('200 אלף ₪');
    expect(formatCurrency(500_000)).toBe('500 אלף ₪');
    expect(formatCurrency(50_000)).toBe('50 אלף ₪');
    expect(formatCurrency(1_500)).toBe('1.5 אלף ₪');
  });

  it('מציג סכומים קטנים כמו שהם', () => {
    expect(formatCurrency(0)).toBe('0 ₪');
    expect(formatCurrency(750)).toBe('750 ₪');
  });
});

describe('formatRooms', () => {
  it('מנסח חדרים בעברית תקינה', () => {
    expect(formatRooms(1)).toBe('חדר אחד');
    expect(formatRooms(3)).toBe('3 חדרים');
    expect(formatRooms(3.5)).toBe('3.5 חדרים');
  });
});
