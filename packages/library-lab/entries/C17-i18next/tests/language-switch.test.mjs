import test from 'node:test';
import assert from 'node:assert/strict';
import {createLatestLanguageSwitcher} from '../examples/language-switch.mjs';

function deferred() {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return {promise, resolve, reject};
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('rapid intents are serialized and only the latest result commits', async () => {
  const calls = [], committed = [];
  const switcher = createLatestLanguageSwitcher(language => {
    const job = deferred(); calls.push({language, ...job}); return job.promise;
  }, {onCommit: value => committed.push(value)});
  switcher.request('en'); switcher.request('zh'); switcher.request('en');
  assert.deepEqual(calls.map(call => call.language), ['en']);
  calls[0].resolve(); await flush();
  assert.deepEqual(calls.map(call => call.language), ['en', 'en']);
  assert.deepEqual(committed, []);
  calls[1].resolve(); await flush();
  assert.deepEqual(committed, ['en']);
  switcher.dispose();
});

test('stale failure does not overwrite the later successful request', async () => {
  const calls = [], committed = [], errors = [];
  const switcher = createLatestLanguageSwitcher(language => {
    const job = deferred(); calls.push({language, ...job}); return job.promise;
  }, {onCommit: value => committed.push(value), onError: error => errors.push(error.message)});
  switcher.request('en'); switcher.request('zh');
  calls[0].reject(new Error('older request failed')); await flush();
  assert.deepEqual(errors, []);
  assert.equal(calls[1].language, 'zh');
  calls[1].resolve(); await flush();
  assert.deepEqual(committed, ['zh']);
  switcher.dispose();
});

test('dispose discards pending language and late completion', async () => {
  const calls = [], committed = [], errors = [];
  const switcher = createLatestLanguageSwitcher(language => {
    const job = deferred(); calls.push({language, ...job}); return job.promise;
  }, {onCommit: value => committed.push(value), onError: error => errors.push(error)});
  switcher.request('en'); switcher.request('zh'); switcher.dispose();
  calls[0].resolve(); await flush();
  switcher.request('en');
  assert.equal(calls.length, 1);
  assert.deepEqual(committed, []);
  assert.deepEqual(errors, []);
});

test('latest rejection reports one error and later requests still work', async () => {
  const calls = [], committed = [], errors = [];
  const switcher = createLatestLanguageSwitcher(language => {
    const job = deferred(); calls.push({language, ...job}); return job.promise;
  }, {onCommit: value => committed.push(value), onError: error => errors.push(error.message)});
  switcher.request('en');
  calls[0].reject(new Error('offline')); await flush();
  assert.deepEqual(errors, ['offline']);
  switcher.request('zh');
  calls[1].resolve(); await flush();
  assert.deepEqual(committed, ['zh']);
  switcher.dispose();
});
