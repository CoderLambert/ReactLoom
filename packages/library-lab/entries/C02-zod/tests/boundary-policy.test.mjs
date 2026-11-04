import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalHttpsFeedUrl, duplicateFeedIndex, isSafeOpmlFilename} from '../examples/boundary-policy.mjs';
test('canonical fetch identity retains path/query case', () => {
  assert.equal(canonicalHttpsFeedUrl(' HTTPS://EXAMPLE.COM:443/Feed?q=A#x '), 'https://example.com/Feed?q=A');
  assert.notEqual(canonicalHttpsFeedUrl('https://example.com/Feed?q=A'),
    canonicalHttpsFeedUrl('https://example.com/feed?q=a'));
});
test('credential, non-HTTPS, control and malformed URLs are invalid', () => {
  for (const url of ['http://example.com', 'https://user@host.test/rss',
    'https://u:p@host.test/rss', 'https://host.test/a\nb', '/relative', ''])
    assert.equal(canonicalHttpsFeedUrl(url), null, url);
});
test('duplicate detection uses canonical URL and ignores invalid URLs', () => {
  const values = [{url:'https://EXAMPLE.COM:443/Feed?q=A#first'},
    {url:'https://example.com/feed?q=A'}, {url:'https://example.com/Feed?q=A#second'}];
  assert.equal(duplicateFeedIndex(values), 2);
  assert.equal(duplicateFeedIndex(values.slice(0, 2)), -1);
  assert.equal(duplicateFeedIndex([{url:'bad'}, {url:'bad'}]), -1);
});
test('OPML import metadata must be a filename, never a path', () => {
  assert.equal(isSafeOpmlFilename('订阅.OPML'), true);
  for (const value of ['../feeds.opml', 'x/feeds.opml', 'C:\\feeds.opml',
    'feeds.opml\n', 'feeds.txt'])
    assert.equal(isSafeOpmlFilename(value), false, value);
});
