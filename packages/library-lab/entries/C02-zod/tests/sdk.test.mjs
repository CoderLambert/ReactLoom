import test from 'node:test';
import assert from 'node:assert/strict';
import * as z from 'zod';
import {canonicalHttpsFeedUrl, duplicateFeedIndex, isSafeOpmlFilename} from '../examples/boundary-policy.mjs';
const Feed = z.strictObject({title:z.string().trim().min(2),
  url:z.string().trim().url().refine(url => canonicalHttpsFeedUrl(url) !== null)});
const Batch = z.strictObject({ttlMinutes:z.string().trim().min(1).regex(/^[1-9]\d?$/u)
  .pipe(z.coerce.number().int().min(1).max(60)),sources:z.array(Feed).min(1).max(5)})
  .superRefine((value, context) => {
    const duplicate = duplicateFeedIndex(value.sources);
    if (duplicate !== -1) context.addIssue({code:'custom',path:['sources',duplicate,'url'],message:'重复订阅源'});
  });
test('real Zod 4 preserves strict schemas, trim and credential rejection', () => {
  const result = Feed.safeParse({title:'  新闻  ',url:'https://example.com/Feed'});
  assert.equal(result.success,true);
  if(result.success) assert.equal(result.data.title,'新闻');
  assert.equal(Feed.safeParse({title:'新闻',url:'https://u:p@example.com/rss'}).success,false);
  assert.equal(Feed.safeParse({title:'新闻',url:'https://example.com/rss',unexpected:true}).success,false);
});
test('real Zod 4 rejects duplicate canonical identities with exact issue path', () => {
  const sources=[{title:'甲源',url:'https://EXAMPLE.COM:443/Feed?q=A'},
    {title:'乙源',url:'https://example.com/Feed?q=A#fragment'}];
  const dupe=Batch.safeParse({ttlMinutes:'15',sources});
  assert.equal(dupe.success,false);
  if(!dupe.success) assert.deepEqual(dupe.error.issues[0].path,['sources',1,'url']);
  const distinct=Batch.safeParse({ttlMinutes:'15',sources:[sources[0],
    {...sources[1],url:'https://example.com/feed?q=A'}]});
  assert.equal(distinct.success,true);
  if(distinct.success) assert.equal(distinct.data.ttlMinutes,15);
  for(const ttl of ['', '1e1','0','61'])
    assert.equal(Batch.safeParse({ttlMinutes:ttl,sources:[sources[0]]}).success,false,ttl);
});
test('real Zod 4 applies file basename policy', () => {
  const Filename=z.string().trim().refine(isSafeOpmlFilename);
  assert.equal(Filename.safeParse('feeds.opml').success,true);
  assert.equal(Filename.safeParse('../feeds.opml').success,false);
});
