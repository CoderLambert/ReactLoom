import test from 'node:test';
import assert from 'node:assert/strict';
import {fingerprintDraft, canApplySubmitResult, shouldBlockCompositionEnter} from '../examples/form-policy.mjs';
const value = {group: '技术', sources: [{name: '前端', url: 'https://example.com/rss'}]};
test('fingerprint follows exact form fields and ordered dynamic rows', () => {
  const original = fingerprintDraft(value);
  assert.equal(original, fingerprintDraft({...value, sources: value.sources.map(source => ({...source}))}));
  assert.notEqual(original, fingerprintDraft({...value, sources: [...value.sources, {name:'安全',url:'https://example.com/sec'}]}));
  assert.notEqual(original, fingerprintDraft({...value, group:'生活'}));
  assert.equal(fingerprintDraft({group: 'x', sources: [{url: 3}]}), null);
});
test('late response cannot update edited, aborted or replaced session', () => {
  const base = {expectedFingerprint: fingerprintDraft(value), currentFingerprint: fingerprintDraft(value),
    expectedEpoch: 5, currentEpoch: 5, aborted: false};
  assert.equal(canApplySubmitResult(base), true);
  assert.equal(canApplySubmitResult({...base, aborted: true}), false);
  assert.equal(canApplySubmitResult({...base, currentEpoch: 6}), false);
  assert.equal(canApplySubmitResult({...base, currentFingerprint: 'new data'}), false);
  assert.equal(canApplySubmitResult({...base, expectedFingerprint: null}), false);
});
test('IME Enter is suppressed across composition states and keyCode 229', () => {
  assert.equal(shouldBlockCompositionEnter({key:'Enter', composing:true}), true);
  assert.equal(shouldBlockCompositionEnter({key:'Enter', isComposing:true}), true);
  assert.equal(shouldBlockCompositionEnter({key:'Enter', keyCode:229}), true);
  assert.equal(shouldBlockCompositionEnter({key:'Enter', sinceCompositionEndMs:50}), true);
  assert.equal(shouldBlockCompositionEnter({key:'Enter', sinceCompositionEndMs:90}), false);
  assert.equal(shouldBlockCompositionEnter({key:'Tab', composing:true}), false);
});
