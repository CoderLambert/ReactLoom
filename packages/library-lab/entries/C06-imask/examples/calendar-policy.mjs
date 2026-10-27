/** Calendar-only validation in UTC; avoid Date.UTC's 0..99 => 1900..1999 remapping. */
export function validCalendarDay(text) {
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const year = Number(text.slice(0,4));
  const month = Number(text.slice(5,7));
  const day = Number(text.slice(8,10));
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const instant = new Date(0);
  instant.setUTCFullYear(year, month-1, day);
  return instant.getUTCFullYear() === year && instant.getUTCMonth() === month-1 && instant.getUTCDate() === day;
}

