import test from 'node:test';
import assert from 'node:assert/strict';
import * as v from 'valibot';
import {canonicalHttpsFeedUrl, isRealCivilDate} from '../examples/boundary-policy.mjs';

test('real Valibot validates and strips extra keys', () => {
  const schema = v.object({name: v.pipe(v.string(), v.trim(), v.minLength(2))});
  const result = v.safeParse(schema, {name: '  RSS  ', secret: 'must not escape'});
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual(result.output, {name: 'RSS'});
});
test('real Valibot emits validation issues', () => {
  const schema = v.pipe(v.string(), v.url());
  const result = v.safeParse(schema, 'not a url');
  assert.equal(result.success, false);
  if (!result.success) assert.ok(result.issues.length);
});
test('real Valibot partialCheck forwards cross-field issue', () => {
  const schema = v.pipe(v.object({start: v.string(), end: v.string()}),
    v.forward(v.partialCheck([['start'], ['end']], value => value.start <= value.end, 'end<start'), ['end']));
  const result = v.safeParse(schema, {start: '2026-11-04', end: '2026-11-01'});
  assert.equal(result.success, false);
  if (!result.success) assert.match(result.issues[0].message, /end<start/);
});

test('real Valibot checks HTTPS credentials and strict civil dates', () => {
  const url = v.pipe(v.string(), v.url(), v.check(x => canonicalHttpsFeedUrl(x) !== null));
  assert.equal(v.safeParse(url, 'https://user:pass@example.com/rss').success, false);
  assert.equal(v.safeParse(url, 'https://example.com/Feed?q=A').success, true);
  const schema = v.object({date: v.pipe(v.string(), v.isoDate(), v.check(isRealCivilDate))});
  const invalid = v.safeParse(schema, {date: '2026-02-29'});
  assert.equal(invalid.success, false);
  if (!invalid.success) assert.equal(invalid.issues[0].path?.[0]?.key, 'date');
  assert.equal(v.safeParse(schema, {date: '2000-02-29'}).success, true);
});
