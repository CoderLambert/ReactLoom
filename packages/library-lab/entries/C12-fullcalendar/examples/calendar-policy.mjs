// A calendar day is not an instant; a timed event must carry an explicit offset.
export function isCivilDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}

export function getUtcInstant(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d{1,3})?(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.exec(value);
  if (!match || !isCivilDate(match[1]) || match[5] === '-00:00') return null;
  const zone = match[5];
  if (zone !== 'Z' && zone.slice(1,3) === '14' && zone.slice(4) !== '00') return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function allocateEventId(sequence, existingIds) {
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new RangeError('invalid local event sequence');
  const occupied = new Set(existingIds);
  let next = sequence;
  while (occupied.has('local-' + next)) {
    if (!Number.isSafeInteger(++next)) throw new RangeError('local event sequence exhausted');
  }
  if (!Number.isSafeInteger(next + 1)) throw new RangeError('local event sequence exhausted');
  return {id: 'local-' + next, nextSequence: next + 1};
}
