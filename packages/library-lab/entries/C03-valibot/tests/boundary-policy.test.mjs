import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalHttpsFeedUrl, isRealCivilDate} from '../examples/boundary-policy.mjs';
test('reject embedded credentials and preserve significant URL case', () => {
  assert.equal(canonicalHttpsFeedUrl('https://user:pass@example.com/rss'), null);
  assert.equal(canonicalHttpsFeedUrl('https://example.com/a\nb'), null);
  assert.equal(canonicalHttpsFeedUrl(' HTTPS://EXAMPLE.COM:443/Feed?q=A#x '), 'https://example.com/Feed?q=A');
});
test('validate leap centuries and impossible civil dates', () => {
  for (const s of ['0096-02-29','2000-02-29','2024-02-29','2026-12-31'])
    assert.equal(isRealCivilDate(s), true, s);
  for (const s of ['1900-02-29','2026-02-29','2026-04-31','2026-11-00','2026-13-01','0000-01-01'])
    assert.equal(isRealCivilDate(s), false, s);
});
