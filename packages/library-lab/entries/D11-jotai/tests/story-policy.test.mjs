import test from 'node:test';
import assert from 'node:assert/strict';
import {toggleStoryRead} from '../examples/story-policy.mjs';
const fixtures = () => [{id:'one',title:'RSS 1',read:false},{id:'two',title:'RSS 2',read:true}];
test('stable-ID toggle updates only the target without mutating store snapshot', () => {
  const old = fixtures();
  const next = toggleStoryRead(old,'one');
  assert.equal(next[0].read,true);
  assert.equal(old[0].read,false);
  assert.equal(next[1],old[1]);
  assert.notEqual(next,old);
});
test('unknown business ID is a no-op and retains previous identity', () => {
  const old = fixtures();
  assert.equal(toggleStoryRead(old,'missing'),old);
});
test('duplicate or missing IDs cannot silently modify two rows', () => {
  assert.throws(()=>toggleStoryRead([{id:'same',read:false},{id:'same',read:true}],'same'),TypeError);
  assert.throws(()=>toggleStoryRead([{id:'',read:false}],'x'),TypeError);
});
test('malformed payloads and targets fail closed', () => {
  assert.throws(()=>toggleStoryRead(null,'one'),TypeError);
  assert.throws(()=>toggleStoryRead([{id:'one',read:0}],'one'),TypeError);
  assert.throws(()=>toggleStoryRead(fixtures(),' '),TypeError);
});
