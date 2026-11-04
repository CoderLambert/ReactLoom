import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldPlayTimeline, progressPercent, shouldPublishProgress} from '../examples/timeline-policy.ts';

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
test('bounded progress updates skip small jitter but publish both endpoints', () => {
  assert.equal(shouldPublishProgress(-1,0),true);
  assert.equal(shouldPublishProgress(0,1),false);
  assert.equal(shouldPublishProgress(0,4),false);
  assert.equal(shouldPublishProgress(0,5),true);
  assert.equal(shouldPublishProgress(95,100),true);
  assert.equal(shouldPublishProgress(100,100),false);
  assert.equal(shouldPublishProgress(100,0),true);
});
test('reverse progress reports meaningful steps in both directions and rejects invalid samples', () => {
  assert.equal(shouldPublishProgress(72,69),false);
  assert.equal(shouldPublishProgress(72,67),true);
  assert.equal(shouldPublishProgress(3,0),true);
  assert.equal(shouldPublishProgress(30,NaN),false);
  assert.equal(shouldPublishProgress(30,101),false);
});
