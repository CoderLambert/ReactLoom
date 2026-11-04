import test from 'node:test';
import assert from 'node:assert/strict';
import {assertWallTimeSyntax} from '../examples/wall-time-policy.mjs';
test('accepts both DST transition wall labels without pretending they exist', () => {
  assert.equal(assertWallTimeSyntax('2026-03-08T02:30'), '2026-03-08T02:30');
  assert.equal(assertWallTimeSyntax('2026-11-01T01:30'), '2026-11-01T01:30');
});
test('rejects invalid civil input without default-zone parsing', () => {
  for (const value of ['2026-02-30T10:00', '1900-02-29T10:00', '0000-01-01T12:00',
    '2026-11-01T24:00', '2026-11-01T01:60', '2026-11-01T01:30Z', '2026-11-01 01:30']) {
    assert.throws(() => assertWallTimeSyntax(value), Error, String(value));
  }
  assert.equal(assertWallTimeSyntax('2000-02-29T12:00'), '2000-02-29T12:00');
});
