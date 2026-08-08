/** מוריד אפסים מיותרים אחרי הנקודה העשרונית בלבד ("1.10" → "1.1", "200" נשאר "200"). */
function trimDecimals(text: string): string {
  return text.includes('.') ? text.replace(/\.?0+$/, '') : text;
}

/** מעצב סכום בשקלים בצורה קריאה: 4,500,000 ₪ → "4.5 מיליון ₪". null בטיוטה ללא שווי. */
export function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${trimDecimals(millions.toFixed(millions % 1 === 0 ? 0 : 2))} מיליון ₪`;
  }
  if (abs >= 1000) {
    const thousands = value / 1000;
    return `${trimDecimals(thousands.toFixed(thousands % 1 === 0 ? 0 : 1))} אלף ₪`;
  }
  return `${value.toLocaleString('he-IL')} ₪`;
}

/** סכום מלא עם מפרידי אלפים, לשימוש בטפסים ובמקומות שדורשים דיוק. */
export function formatCurrencyExact(value: number | null): string {
  if (value === null) return '—';
  return `${Math.round(value).toLocaleString('he-IL')} ₪`;
}

/** "3.5 חדרים" / "3 חדרים" / "חדר אחד" */
export function formatRooms(rooms: number): string {
  if (rooms === 1) return 'חדר אחד';
  const text = rooms % 1 === 0 ? String(rooms) : rooms.toFixed(1);
  return `${text} חדרים`;
}

/**
 * כל התאריכים מוצגים בשעון ישראל, ולא בשעון של המכשיר או של השרת.
 * זה נכון מבחינת המוצר (פלטפורמה ישראלית), וגם מונע פער בין מה שהשרת
 * מרנדר לבין מה שהדפדפן מרנדר — פער כזה גורם ל-React לרנדר מחדש.
 */
const TIME_ZONE = 'Asia/Jerusalem';

/** תאריך קצר בעברית. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** שעה ותאריך קצרים, לשימוש בצ'אט. */
export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const dayKey = (value: Date) => value.toLocaleDateString('he-IL', { timeZone: TIME_ZONE });
  const sameDay = dayKey(date) === dayKey(new Date());

  return sameDay
    ? date.toLocaleTimeString('he-IL', {
        timeZone: TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
      })
    : date.toLocaleString('he-IL', {
        timeZone: TIME_ZONE,
        day: 'numeric',
        month: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

/**
 * ממיר storage_path לכתובת תמונה מוצגת.
 * נתוני הדמו שומרים נתיב מקומי (\u200E/placeholders/...), מודעות אמיתיות שומרות
 * נתיב בתוך דלי האחסון של Supabase.
 */
export function photoUrl(storagePath: string): string {
  if (storagePath.startsWith('/') || storagePath.startsWith('http')) {
    return storagePath;
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/listing-photos/${storagePath}`;
}
