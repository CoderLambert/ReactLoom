import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { riveRuntimePolicy } from '../examples/runtime-policy.ts';

const base = { level: 'basic' as const, pageVisible: true, inView: true, reducedMotion: false, manuallyPaused: false, phase: 'idle' as const };
test('basic player mounts and can play', () => assert.deepEqual(riveRuntimePolicy(base), { mount: true, play: true }));
test('hidden page releases Rive WebGL2 instance instead of merely pausing', () => assert.deepEqual(riveRuntimePolicy({ ...base, pageVisible: false }), { mount: false, play: false }));
test('advanced player does not allocate an offscreen renderer', () => assert.deepEqual(riveRuntimePolicy({ ...base, level: 'advanced', inView: false }), { mount: false, play: false }));
test('reduced motion and explicit pause leave static player without autoplay', () => {
  assert.deepEqual(riveRuntimePolicy({ ...base, reducedMotion: true }), { mount: true, play: false });
  assert.deepEqual(riveRuntimePolicy({ ...base, manuallyPaused: true }), { mount: true, play: false });
});
test('business animation only runs during active review', () => {
  assert.equal(riveRuntimePolicy({ ...base, level: 'business' }).play, false);
  assert.equal(riveRuntimePolicy({ ...base, level: 'business', phase: 'pending' }).play, true);
});
