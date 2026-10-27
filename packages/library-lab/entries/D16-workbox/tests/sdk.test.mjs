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
  assert.equal(rule.urlPattern.test('https://lab.example.test/__library_lab_workbox__/api/public/rss?id=1'), true);
  assert.equal(rule.urlPattern.test('https://other.test/__library_lab_workbox__/api/public/rss'), false);
  assert.equal(rule.urlPattern.test('https://lab.example.test/__library_lab_workbox__/api/private/profile'), false);
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
