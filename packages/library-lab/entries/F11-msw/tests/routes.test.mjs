import test from 'node:test';
import assert from 'node:assert/strict';
import {scenarioEndpoints, NODE_SCENARIO_BASE, BROWSER_RUNNER_SCOPE} from '../examples/routes.mjs';

test('Node fixtures use a non-routable .invalid origin', () => {
  for (const value of Object.values(scenarioEndpoints(NODE_SCENARIO_BASE))) {
    assert.equal(new URL(value).hostname, 'library-lab.invalid');
  }
});
test('browser fixtures resolve within the same-origin runner scope', () => {
  const urls = scenarioEndpoints('http://127.0.0.1:4319' + BROWSER_RUNNER_SCOPE);
  for (const value of Object.values(urls)) {
    assert.equal(new URL(value).origin, 'http://127.0.0.1:4319');
    assert.ok(new URL(value).pathname.startsWith(BROWSER_RUNNER_SCOPE));
  }
});
test('rejects malformed or ambiguous base URLs', () => {
  for (const value of [
    'https://example.test/lab-runners/msw', 'file:///tmp/',
    'https://u:p@example.test/', 'https://example.test/?next=a',
  ]) {
    assert.throws(() => scenarioEndpoints(value));
  }
});
