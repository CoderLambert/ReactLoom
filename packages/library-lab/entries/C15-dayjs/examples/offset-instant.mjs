import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

// A numeric offset alone is an instant; require it to agree with the named IANA zone.
// Never ask dayjs.tz to guess which instant an ambiguous 01:30 denotes.
export function resolveExplicitZonedInstant(input, zone) {
  const match = typeof input === 'string' &&
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}):\d{2}(Z|[+-]\d{2}:\d{2})$/.exec(input);
  if (!match || match[1].startsWith('0000-')) {
    throw new Error('事件必须提供秒与明确 UTC 偏移，例如 2026-11-01T01:30:00-04:00');
  }
  const candidate = dayjs(input);
  if (!candidate.isValid()) throw new Error('非法的绝对事件时间');
  const localized = candidate.tz(zone);
  const offset = match[2] === 'Z' ? '+00:00' : match[2];
  if (localized.format('YYYY-MM-DDTHH:mm') !== match[1] || localized.format('Z') !== offset) {
    throw new Error('事件墙上时间/偏移与指定 IANA 时区不一致，可能位于 DST 跳过时间');
  }
  return {zone, wall: match[1], offset, instant: candidate.toISOString()};
}
