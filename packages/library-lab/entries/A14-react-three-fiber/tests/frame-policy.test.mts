import assert from 'node:assert/strict';
import test from 'node:test';
import {boundedFrameDelta, shouldRunFrames} from '../examples/frame-policy.ts';

const defaults = {paused: false, reducedMotion: false, visible: true, speed: 0.9};
test('runs only while foreground, allowed and actually rotating', () => {
  assert.equal(shouldRunFrames(defaults), true);
  assert.equal(shouldRunFrames({...defaults, paused: true}), false);
  assert.equal(shouldRunFrames({...defaults, reducedMotion: true}), false);
  assert.equal(shouldRunFrames({...defaults, visible: false}), false);
  assert.equal(shouldRunFrames({...defaults, speed: 0}), false);
});
test('refuses invalid speed and clamps long frame gaps', () => {
  assert.equal(shouldRunFrames({...defaults, speed: Number.NaN}), false);
  assert.equal(shouldRunFrames({...defaults, speed: Infinity}), false);
  assert.equal(boundedFrameDelta(-1), 0);
  assert.equal(boundedFrameDelta(12), 0.1);
  assert.equal(boundedFrameDelta(0.02), 0.02);
  assert.equal(boundedFrameDelta(Infinity), 0);
});
test('intersection and document visibility jointly stop the frame loop', () => {
  const visibleDocumentAndCanvas = true;
  const offscreenCanvas = false;
  assert.equal(shouldRunFrames({...defaults, visible: visibleDocumentAndCanvas && offscreenCanvas}), false);
  assert.equal(shouldRunFrames({...defaults, visible: visibleDocumentAndCanvas && true}), true);
});
