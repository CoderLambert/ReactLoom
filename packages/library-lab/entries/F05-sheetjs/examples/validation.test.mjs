import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize, MAX_ROWS} from './validation.mjs';
const row = (channel = 'Frontend', views = 3, kind = 'RSS') => ({channel, views, kind});
test('preserves validated structured input', () => assert.deepEqual(normalize([row()]), [row()]));
test('escapes dangerous formula prefixes exactly once across repeated normalization', () => {
  for (const start of ['=', '+', '-', '@']) {
    const once = normalize([row(`${start}HYPERLINK("https://example.test")`)]);
    assert.equal(once[0].channel[0], "'");
    assert.deepEqual(normalize(once), once);
  }
});
test('trims and rejects invalid headers/extra fields', () => {
  for (const invalid of [{views:1,kind:'RSS'}, {...row(), extra:'x'}, {...row(), kind:undefined}]) {
    assert.throws(() => normalize([invalid]));
  }
});
test('rejects whitespace-only and control-containing labels', () => {
  for (const text of ['', '  ', 'good\u0000bad']) assert.throws(() => normalize([row(text)]));
});
test('rejects number edge cases and prototype-like records', () => {
  for (const value of [-1, NaN, Infinity, 1.3, Number.MAX_SAFE_INTEGER + 1, '3']) {
    assert.throws(() => normalize([row('A', value)]));
  }
  assert.throws(() => normalize([null]));
});
test('rejects duplicate channel regardless of capitalization and leading whitespace', () => {
  assert.throws(() => normalize([row('Frontend'), row(' frontend ')]));
});
test('enforces 200 row cap before export', () => {
  assert.equal(normalize(Array.from({length:MAX_ROWS},(_,i)=>row(`Channel ${i}`))).length, MAX_ROWS);
  assert.throws(() => normalize(Array.from({length:MAX_ROWS+1},(_,i)=>row(`Channel ${i}`))));
});
