import test from 'node:test';
import assert from 'node:assert/strict';
import clsx from 'clsx';
import {clsx as lite} from 'clsx/lite';
import {cardClassInputs} from '../examples/class-policy.mjs';
test('real clsx merges approved card parts and ignores unapproved server tone', () => {
  assert.equal(clsx(...cardClassInputs({selected:true,tone:'success'})), 'demo-card is-selected tone-success');
  assert.equal(clsx(...cardClassInputs({disabled:true,tone:'hidden fixed'})), 'demo-card is-disabled');
  assert.equal(clsx(...cardClassInputs({selected:false,tone:'neutral'})), 'demo-card');
});
test('real clsx differs from lite and does not deduplicate Tailwind utilities', () => {
  assert.equal(clsx('px-2','px-4'),'px-2 px-4');
  assert.equal(clsx(['base',{active:true}]),'base active');
  assert.equal(lite('base',{active:true},false,'ready'),'base ready');
  assert.equal(clsx(null,false,0,1),'1');
});
