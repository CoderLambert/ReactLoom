import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalHttpsFeedUrl, validateFeedBoundaries} from '../examples/rss-policy.mjs';
test('reject embedded credentials, insecure protocols and invalid URLs', () => {
  for (const v of ['http://example.com/rss','https://user:pass@example.com/rss',
    'https://example.com/rss\nxxx','/relative',''])
    assert.equal(canonicalHttpsFeedUrl(v),null,v);
});
test('batch duplicate uses URL identity not JSON-object equality', () => {
  const payload={feeds:[{id:'first',url:'https://EXAMPLE.COM:443/Feed?q=A'},
    {id:'different',url:'https://example.com/feed?q=A'},
    {id:'third',url:'https://example.com/Feed?q=A#fragment'}]};
  assert.deepEqual(validateFeedBoundaries('business',payload).map(x=>x.path),['/feeds/2/url']);
});
test('single RSS record has exact field error; advanced configuration has no RSS fields', () => {
  assert.deepEqual(validateFeedBoundaries('basic',{url:'https://user@host.test/feed'})
    .map(x=>x.path),['/url']);
  assert.deepEqual(validateFeedBoundaries('advanced',{enabled:true,maxConcurrent:1}),[]);
});
