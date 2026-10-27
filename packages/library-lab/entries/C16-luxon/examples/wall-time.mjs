import {DateTime} from 'luxon';
import {assertWallTimeSyntax} from './wall-time-policy.mjs';

// Spring-forward wall times do not exist; fall-back labels can have two instants.
// Explicitly choose an offset rather than inheriting Luxon's fallback guess.
export function resolveWallTime(value, zone, selectedOffset) {
  const wall = assertWallTimeSyntax(value);
  const parsed = DateTime.fromISO(wall, {zone, setZone: true});
  if (!parsed.isValid) throw new Error(parsed.invalidExplanation ?? '时区或本地时间无效');
  if (parsed.toFormat("yyyy-MM-dd'T'HH:mm") !== wall) {
    throw new Error('本地时间处于 DST 春季跳跃区间，不存在该时刻');
  }
  const options = parsed.getPossibleOffsets();
  const candidates = options.length ? options : [parsed];
  if (candidates.length > 1 && !selectedOffset) {
    throw new Error('DST 回拨产生两个时刻，必须明确选择 UTC 偏移');
  }
  const chosen = selectedOffset
    ? candidates.find(candidate => candidate.toFormat('ZZ') === selectedOffset)
    : candidates[0];
  if (!chosen) throw new Error('给定偏移与此时区的本地时刻不匹配');
  return {wall, zone, offset: chosen.toFormat('ZZ'), instant: chosen.toUTC().toISO()};
}
