import test from 'node:test';
import assert from 'node:assert/strict';
import {validateHeaders, normalizeFeed} from '../examples/policy.mjs';

test('requires exact three-column header and rejects automatic duplicate rename', () => {
  assert.doesNotThrow(() => validateHeaders(['title','url','note']));
  for (const headers of [[], ['title','url'], ['title','note','url'], ['title','url','note','extra'], ['title','url','url']]) {
    assert.throws(() => validateHeaders(headers), /表头/);
  }
  assert.throws(() => validateHeaders(['title','url','note'], {url: 'url_1'}), /表头/);
});
test('normalizes valid HTTPS, strips fragment and deduplicates equivalent links', () => {
  const seen = new Set();
  assert.deepEqual(normalizeFeed({title:' RSS ',url:'https://EXAMPLE.org/rss#article',note:'ok\nnext'},seen),
    {title:'RSS',url:'https://example.org/rss',note:'ok\nnext'});
  assert.throws(() => normalizeFeed({title:'again',url:'https://example.org/rss',note:''},seen), /重复/);
});
test('rejects credentials, unsafe schemes, control characters and stray fields', () => {
  for (const url of ['http://example.org/rss','https://x:y@example.org/feed','file:///tmp/rss','javascript:alert(1)','not a url']) {
    assert.throws(() => normalizeFeed({title:'test',url,note:''},new Set()));
  }
  for (const raw of [
    {title:'x\u0000y',url:'https://example.org',note:''},
    {title:'test',url:'https://example.org',note:'bad\u0000thing'},
    {title:'test',url:'https://example.org',note:'',unexpected:'extra'},
    {title:'',url:'https://example.org',note:''},
    {title:'a'.repeat(161),url:'https://example.org',note:''},
    {title:'valid',url:'https://example.org',note:5},
  ]) assert.throws(() => normalizeFeed(raw,new Set()));
});
