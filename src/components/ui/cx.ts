/** צירוף מחרוזות class עם דילוג על ערכים ריקים. מחליף תלות חיצונית בשורה אחת. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
