import test from 'node:test';
import assert from 'node:assert/strict';
import {findExactScopeRegistration, assertWorkerRegistration} from './registration-policy.mjs';
const scoped = 'https://lab.example/lab-runners/msw/';
const script = scoped + 'mockServiceWorker.js';
test('global root worker is never mistaken for scoped MSW registration', () => {
  assert.equal(findExactScopeRegistration([{scope: 'https://lab.example/'}], scoped), null);
});
test('strict scope and worker script validation', () => {
  const good = {scope: scoped, active: {scriptURL: script}};
  assert.equal(findExactScopeRegistration([{scope: 'https://lab.example/'}, good], scoped), good);
  assert.equal(assertWorkerRegistration(good, scoped, script), good);
  assert.throws(() => assertWorkerRegistration({scope: 'https://lab.example/',active:{scriptURL:script}}, scoped, script), /scope/);
  assert.throws(() => assertWorkerRegistration({scope:scoped,waiting:{scriptURL:scoped+'other.js'}}, scoped, script), /script/);
});
test('installing worker is accepted while the same script is being activated', () => {
  assert.equal(assertWorkerRegistration({scope:scoped,installing:{scriptURL:script}},scoped,script).scope,scoped);
});
test('foreign updates cannot be hidden beside the expected script', () => {
  assert.throws(() => assertWorkerRegistration({
    scope:scoped,active:{scriptURL:script},waiting:{scriptURL:scoped+'foreign.js'},
  }, scoped, script), /script/);
});
