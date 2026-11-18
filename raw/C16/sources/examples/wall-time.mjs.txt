import { DateTime } from 'luxon'
import { assertWallTimeSyntax } from './wall-time-policy.mjs'

// A valid DateTime alone does not prove the input clock label existed.
function wallCandidates(value, zone) {
  const wall = assertWallTimeSyntax(value)
  const parsed = DateTime.fromISO(wall, { zone, setZone: true })
  if (!parsed.isValid) throw new Error(parsed.invalidExplanation ?? '时区或本地时间无效')
  if (parsed.toFormat("yyyy-MM-dd'T'HH:mm") !== wall) {
    throw new Error('本地时间处于 DST 春季跳跃区间，不存在该时刻')
  }
  const options = parsed.getPossibleOffsets()
  return { wall, candidates: options.length ? options : [parsed] }
}

// This is inspection, not permission to persist an ambiguous first candidate.
export function inspectWallTime(value, zone) {
  const { wall, candidates } = wallCandidates(value, zone)
  return {
    wall,
    zone,
    candidates: candidates.map((candidate) => ({
      offset: candidate.toFormat('ZZ'),
      local: candidate.toISO(),
      instant: candidate.toUTC().toISO(),
    })),
  }
}

// Original contract: reject gaps and require the caller's explicit overlap offset.
export function resolveWallTime(value, zone, selectedOffset) {
  const { wall, candidates } = wallCandidates(value, zone)
  if (candidates.length > 1 && !selectedOffset) {
    throw new Error('DST 回拨产生两个时刻，必须明确选择 UTC 偏移')
  }
  const chosen = selectedOffset
    ? candidates.find((candidate) => candidate.toFormat('ZZ') === selectedOffset)
    : candidates[0]
  if (!chosen) throw new Error('给定偏移与此时区的本地时刻不匹配')
  return { wall, zone, offset: chosen.toFormat('ZZ'), instant: chosen.toUTC().toISO() }
}
