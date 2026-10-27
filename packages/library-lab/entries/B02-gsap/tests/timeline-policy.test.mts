import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldPlayTimeline, progressPercent} from '../examples/timeline-policy.ts';

test('visible and unpaused timeline may run', () => {
  assert.equal(shouldPlayTimeline({reducedMotion:false,pageVisible:true,userPaused:false}), true);
});
test('user pause survives hidden and visible transitions', () => {
  assert.equal(shouldPlayTimeline({reducedMotion:false,pageVisible:false,userPaused:true}), false);
  assert.equal(shouldPlayTimeline({reducedMotion:false,pageVisible:true,userPaused:true}), false);
});
test('visibility and motion preference are both hard stops', () => {
  assert.equal(shouldPlayTimeline({reducedMotion:false,pageVisible:false,userPaused:false}), false);
  assert.equal(shouldPlayTimeline({reducedMotion:true,pageVisible:true,userPaused:false}), false);
});
test('progress reports percentage bounded to valid range', () => {
  assert.deepEqual([progressPercent(-1),progressPercent(0.517),progressPercent(2),progressPercent(NaN)], [0,52,100,0]);
});
