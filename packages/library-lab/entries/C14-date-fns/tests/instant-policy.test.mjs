import test from 'node:test';
import assert from 'node:assert/strict';
import {assertExplicitInstant} from '../examples/instant-policy.mjs';

test('two fall-back offsets are accepted as distinct explicit instants', () => {
  assert.equal(assertExplicitInstant('2026-11-01T01:30:00-04:00'), '2026-11-01T01:30:00-04:00');
  assert.equal(assertExplicitInstant('2026-11-01T01:30:00-05:00'), '2026-11-01T01:30:00-05:00');
});
test('leap calendar dates and maximum UTC offset', () => {
  assert.equal(assertExplicitInstant('2000-02-29T23:59:59.999+14:00'), '2000-02-29T23:59:59.999+14:00');
  assert.equal(assertExplicitInstant('0096-02-29T00:00:00Z'), '0096-02-29T00:00:00Z');
});
test('rejects missing offsets, unknown offset, overflow and missing clock', () => {
  for (const value of ['2026-11-01T01:30:00', '2026-11-01', '2026-11-01Z', '2026-11-01T01:30:00-00:00',
    '1900-02-29T00:00:00Z', '2026-02-30T00:00:00Z', '0000-01-01T00:00:00Z',
    '2026-03-08T24:00:00Z', '2026-03-08T12:60:00Z', '2026-03-08T12:00:60Z',
    '2026-03-08T12:00:00+14:30', '2026-03-08T12:00:00+25:00', '2026-03-08T12:00:00.0000Z']) {
    assert.throws(() => assertExplicitInstant(value), Error, value);
  }
});
