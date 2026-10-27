// RFC 3339 timestamp policy: never infer an offset for an event instant.
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;
const leap = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

export function assertExplicitInstant(value) {
  if (typeof value !== 'string' || value.length > 35) throw new Error('事件必须是带明确偏移的 ISO 日期时间');
  const match = INSTANT.exec(value);
  if (!match) throw new Error('事件必须包含 YYYY-MM-DDTHH:mm:ss、Z 或 ±HH:mm');
  const [, yr, mo, da, hr, mi, se, , suffix] = match;
  const [year, month, day, hour, minute, second] = [yr, mo, da, hr, mi, se].map(Number);
  const days = [31, leap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1] ||
      hour > 23 || minute > 59 || second > 59) throw new Error('非法事件日期或时间');
  if (suffix === '-00:00') throw new Error('-00:00 表示偏移未知，不可当作明确事件时间');
  if (suffix !== 'Z') {
    const offsetHours = Number(suffix.slice(1, 3));
    const offsetMinutes = Number(suffix.slice(4));
    if (offsetHours > 14 || offsetMinutes > 59 || (offsetHours === 14 && offsetMinutes !== 0)) {
      throw new Error('事件 UTC 偏移超出 ±14:00');
    }
  }
  return value;
}
