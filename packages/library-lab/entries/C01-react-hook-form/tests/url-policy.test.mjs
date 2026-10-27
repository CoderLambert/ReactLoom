import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalFeedUrl, findDuplicateFeedIndex} from '../examples/feed-url-policy.mjs';

test('host, default HTTPS port, whitespace and fragments canonicalize', () => {
  assert.equal(canonicalFeedUrl(' HTTPS://EXAMPLE.COM:443/Feed?item=AbC#section '),
    'https://example.com/Feed?item=AbC');
  assert.equal(canonicalFeedUrl('https://example.com'), 'https://example.com/');
});
test('path and query remain case-sensitive instead of lowercasing entire RSS URL', () => {
  assert.notEqual(canonicalFeedUrl('https://example.com/Feed?q=A'),
    canonicalFeedUrl('https://example.com/feed?q=a'));
});
test('reject credentials, insecure schemes, invalid URLs and control characters', () => {
  for (const source of [
    'http://example.com/feed',
    'https://user:token@example.com/feed',
    'https://user@example.com/feed',
    'javascript:alert(1)',
    '/relative/feed',
    '',
    'https://example.com/a\nb',
  ]) {
    assert.equal(canonicalFeedUrl(source), null, source);
  }
});
test('duplicate detection handles canonical fetch identity', () => {
  const sources = [
    {url:'https://EXAMPLE.com:443/Feed?kind=News#one'},
    {url:'https://example.com/Feed?kind=news'},
    {url:'https://example.com/feed?kind=News'},
    {url:'https://example.com/Feed?kind=News#two'},
  ];
  assert.equal(findDuplicateFeedIndex(sources), 3);
  assert.equal(findDuplicateFeedIndex(sources.slice(0, 3)), -1);
});
test('invalid entries are handled by field validator and do not form duplicate keys', () => {
  assert.equal(findDuplicateFeedIndex([{url:'bad'}, {url:'bad'}]), -1);
});
