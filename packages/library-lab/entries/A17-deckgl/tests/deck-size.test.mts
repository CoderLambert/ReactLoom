import test from 'node:test';
import assert from 'node:assert/strict';
import {measuredDeckSize, needsDeckResize} from '../examples/deck-size.ts';

test('zero or invalid container dimensions do not resize GPU', () => {
  for (const [width,height] of [[0,300],[300,0],[-1,80],[NaN,200],[Infinity,50]]) {
    assert.equal(measuredDeckSize(width,height), null);
  }
});
test('fractional CSS pixels are rounded to stable integer dimensions', () => {
  assert.deepEqual(measuredDeckSize(214.1,300.5), {width:215,height:301});
  assert.deepEqual(measuredDeckSize(0.1,0.1), {width:1,height:1});
});
test('abnormally large containers have bounded GPU allocation', () => {
  assert.deepEqual(measuredDeckSize(100000,100000), {width:4096,height:4096});
});
test('no-op resize and hidden resize are skipped; actual size change runs', () => {
  const current = {width:320,height:240};
  assert.equal(needsDeckResize(current, null), false);
  assert.equal(needsDeckResize(current, measuredDeckSize(320,240)), false);
  assert.equal(needsDeckResize(current, measuredDeckSize(321,240)), true);
});
