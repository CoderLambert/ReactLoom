import test from 'node:test';
import assert from 'node:assert/strict';
import {runWorkshop, workboxOptions, ISOLATED_SCOPE} from '../examples/workshop.mjs';

test('real workbox-build: build an isolated precache without registering a service worker', async () => {
  const summary = await runWorkshop('basic');
  assert.equal(summary.scope, ISOLATED_SCOPE);
  assert.equal(summary.registrationExecuted, false);
  assert.ok(summary.precacheUrls.includes('index.html'));
  assert.ok(summary.precacheUrls.includes('app.js'));
  assert.ok(summary.precacheUrls.every(url => !url.includes('private/')));
  assert.ok(summary.swBytes > 0);
  assert.ok(summary.generatedFiles.some(name => name === 'sw.js'));
});
test('real workbox-build: public GET runtime strategy is narrow and bounded', async () => {
  const settings = workboxOptions('/tmp/isolated', 'business');
  const rule = settings.runtimeCaching[0];
  assert.equal(rule.method, 'GET');
  assert.equal(rule.handler, 'NetworkFirst');
  assert.deepEqual(rule.options.cacheableResponse.statuses, [200]);
  assert.equal(rule.options.expiration.maxEntries, 12);
  const match = (url, init = {}) => rule.urlPattern({url: new URL(url), request: new Request(url, init)});
  assert.equal(match('https://lab.example.test/__library_lab_workbox__/api/public/rss?id=1', {credentials:'omit'}), true);
  assert.equal(match('https://lab.example.test/__library_lab_workbox__/api/public/rss?id=1'), false);
  assert.equal(match('https://lab.example.test/__library_lab_workbox__/api/public/rss?id=1', {credentials:'omit', headers:{Authorization:'Bearer secret'}}), false);
  assert.equal(match('https://other.test/__library_lab_workbox__/api/public/rss', {credentials:'omit'}), false);
  assert.equal(match('https://lab.example.test/__library_lab_workbox__/api/private/profile', {credentials:'omit'}), false);
  const summary = await runWorkshop('business');
  assert.equal(summary.runtimeStrategy, 'NetworkFirst-public-GET-only');
});
test('real workbox-build: offline fallback and private directory exclusion', async () => {
  const result = await runWorkshop('advanced');
  assert.equal(result.fallback, 'offline.html');
  assert.ok(result.precacheUrls.includes('offline.html'));
  assert.ok(result.precacheUrls.every(url => !url.includes('tokens')));
  assert.equal(result.registrationExecuted, false);
});
