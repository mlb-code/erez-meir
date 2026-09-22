/**
 * קבועים ניתנים לכוונון של מנוע ההתאמות (v2, איפיון §6).
 * שינוי כאן משנה ציונים ומדיניות תצוגה — לא את הלוגיקה של מי מתאים למי.
 */
export const MATCHING_CONFIG = {
  /** אורך מעגל מקסימלי שהמנוע מחשב. */
  MAX_CHAIN_LENGTH: 5,
  /**
   * אורך מעגל מקסימלי שמוצג למשתמשים בשלב 1 (הנחה ה3, מאושרת): ישיר + משולש.
   * שרשראות 4–5 = שלב 3. seed הדמו מריץ עם 5 כדי לשמור את הדגמת השרשרת של 4.
   */
  MAX_CHAIN_LENGTH_SHOWN: 3,

  /** ציון לכל צד (§6.3) — הרכיבים מסתכמים ל-100. */
  SIDE_BASE: 20,
  VALUE_PROXIMITY_WEIGHT: 25,
  /** פער מזומן, כשיעור משווי הדירה, שמאפס את רכיב קרבת השווי. */
  VALUE_GAP_ZERO_RATIO: 0.15,
  SURPLUS_WEIGHT: 15,
  ROOMS_SURPLUS_CAP: 1.5,
  SQM_SURPLUS_CAP: 30,
  TIME_FIT_WEIGHT: 10,
  SOFT_PREFS_WEIGHT: 20,
  LEGAL_CLEAN_WEIGHT: 10,
  /** קנסות ברכיב הניקיון המשפטי (מתוך 10). */
  LEGAL_PENALTY_MORTGAGE: 2,
  LEGAL_PENALTY_TENANT: 5,
  LEGAL_PENALTY_CAVEATS: 4,
  LEGAL_PENALTY_LIENS: 8,

  /** ציון המעגל = מינימום ציוני הצדדים + רכיב אורך. */
  DIRECT_BONUS: 8,
  CHAIN_LENGTH_PENALTY: 5,

  /** הסתברות סגירה (היוריסטיקה, שלב 1). */
  CLOSE_PROB_SCORE_WEIGHT: 0.8,
  CLOSE_PROB_LENGTH_PENALTY: 0.12,
  CLOSE_PROB_VERIFIED_BONUS: 0.1,
  CLOSE_PROB_MIN: 0.02,
  CLOSE_PROB_MAX: 0.95,
} as const;
