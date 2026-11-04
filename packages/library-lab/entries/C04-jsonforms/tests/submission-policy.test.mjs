import test from 'node:test';
import assert from 'node:assert/strict';
import {subscriptionSchema, toSubscriptionPayload, validateSubmission, toServerError} from '../examples/submission-policy.mjs';

test('manual mode drops stale or hidden RSS URL entirely', () => {
  assert.deepEqual(toSubscriptionPayload({name: '  Weekly  ', feedType: 'manual', url: 'https://secret.test/private', enabled: true}),
    {name: 'Weekly', feedType: 'manual', enabled: true});
  assert.equal(validateSubmission({name: 'Weekly', feedType: 'manual', enabled: true}), null);
  assert.equal('url' in toSubscriptionPayload({name:'OK', feedType:'manual'}), false);
});
test('conditional schema validates RSS URL only when feedType is rss', () => {
  assert.deepEqual(subscriptionSchema.then.required, ['url']);
  assert.equal(subscriptionSchema.properties.url.minLength, undefined);
  assert.equal(subscriptionSchema.then.properties.url.pattern, '^https://');
});
test('server policy rejects credential, fragment, malformed and non-HTTPS RSS URLs', () => {
  for (const url of ['http://example.org/feed', 'https://user:password@example.org/feed',
    'https://example.org/feed#secret', 'https://?broken', 'https://']) {
    assert.equal(validateSubmission({name:'RSS', feedType:'rss', url, enabled:true})?.field, 'url', url);
  }
  assert.equal(validateSubmission({name:'RSS',feedType:'rss',url:'https://example.org/feed.xml',enabled:true}),null);
});
test('server error uses JSON Forms additionalErrors instancePath', () => {
  assert.deepEqual(toServerError('url','HTTPS required'), {instancePath:'/url',schemaPath:'#/server/validation',keyword:'errorMessage',params:{},message:'HTTPS required'});
  assert.throws(() => toServerError('token','no'), TypeError);
});
