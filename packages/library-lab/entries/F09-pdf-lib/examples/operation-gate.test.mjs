import test from 'node:test';
import assert from 'node:assert/strict';
import {createOperationGate} from './operation-gate.mjs';
test('two synchronous clicks cannot start concurrent PDF parsing', () => {
  const gate=createOperationGate(); const first=gate.begin();
  assert.equal(typeof first,'number'); assert.equal(gate.begin(),null);
  assert.equal(gate.finish(first),true); assert.notEqual(gate.begin(),null);
});
test('changing levels invalidates old results and old finally cannot close next job', () => {
  const gate=createOperationGate(); const old=gate.begin();gate.invalidate();
  const next=gate.begin();assert.notEqual(old,next);
  assert.equal(gate.isCurrent(old),false); assert.equal(gate.finish(old),false);
  assert.equal(gate.isCurrent(next),true);assert.equal(gate.finish(next),true);
});
test('duplicate finish is ignored', () => {
 const gate=createOperationGate();const id=gate.begin();assert.equal(gate.finish(id),true);assert.equal(gate.finish(id),false);
});
