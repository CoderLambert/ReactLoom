import test from 'node:test';
import assert from 'node:assert/strict';
import {createExclusiveSessionGate} from './session-gate.mjs';

test('lease is taken synchronously before any async setup can overlap', async () => {
  const gate = createExclusiveSessionGate();
  const release = gate.acquire();
  await Promise.resolve();
  assert.throws(() => gate.acquire(), /already starting or active/);
  assert.equal(gate.isHeld(), true);
  assert.equal(release(), true);
  assert.equal(gate.isHeld(), false);
});

test('release is idempotent and cannot release a later owner', () => {
  const gate = createExclusiveSessionGate();
  const releaseA = gate.acquire();
  assert.equal(releaseA(), true);
  const releaseB = gate.acquire();
  assert.equal(releaseA(), false);
  assert.equal(gate.isHeld(), true);
  assert.equal(releaseB(), true);
  assert.equal(gate.isHeld(), false);
});

test('a failed start may release explicitly; a failed stop retains its lease', () => {
  const gate = createExclusiveSessionGate();
  const releaseOnStartError = gate.acquire();
  releaseOnStartError();
  const releaseOnSuccessfulStop = gate.acquire();
  assert.throws(() => gate.acquire());
  assert.equal(gate.isHeld(), true);
  releaseOnSuccessfulStop();
  assert.doesNotThrow(() => gate.acquire());
});
