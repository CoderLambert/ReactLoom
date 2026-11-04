import test from 'node:test';
import assert from 'node:assert/strict';
import {matchPublicRssRequest} from '../examples/cache-policy.mjs';
const endpoint = 'https://lab.example.test/__library_lab_workbox__/api/public/rss?id=1';
function matches(url, init = {}) {
  return matchPublicRssRequest({url: new URL(url), request: new Request(url, init)});
}
test('only explicitly anonymous public GET requests match', () => {
  assert.equal(matches(endpoint, {credentials:'omit'}), true);
  assert.equal(matches(endpoint), false, 'default same-origin credentials must not be cached');
  assert.equal(matches(endpoint, {method:'POST',credentials:'omit'}), false);
  assert.equal(matches(endpoint, {credentials:'omit',headers:{Authorization:'Bearer X'}}), false);
  assert.equal(matches(endpoint, {credentials:'omit',headers:{Cookie:'session=X'}}), false);
});
test('match exact trusted origin and endpoint, not prefix/siblings', () => {
  for(const url of [
    'https://other.test/__library_lab_workbox__/api/public/rss',
    'http://lab.example.test/__library_lab_workbox__/api/public/rss',
    'https://lab.example.test/__library_lab_workbox__/api/public/rss-secret',
    'https://lab.example.test/__library_lab_workbox__/api/private/profile',
    'https://lab.example.test.evil.test/__library_lab_workbox__/api/public/rss',
  ]) assert.equal(matches(url,{credentials:'omit'}),false,url);
});
test('reject incomplete routing input rather than matching by accident',()=>{
 assert.equal(matchPublicRssRequest({}), false);
 assert.equal(matchPublicRssRequest({url:new URL(endpoint)}),false);
});
