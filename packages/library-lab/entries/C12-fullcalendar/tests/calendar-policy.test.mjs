import test from 'node:test';
import assert from 'node:assert/strict';
import {isCivilDate,getUtcInstant,allocateEventId} from '../examples/calendar-policy.mjs';
test('all day dates reject normalization and accept leap years',()=>{
 assert.equal(isCivilDate('2028-02-29'),true);
 for(const value of ['2026-02-29','2026-02-30','2026-11-31','2026-13-01']) assert.equal(isCivilDate(value),false);
});
test('DST duplicated local wall time maps to different explicit-offset instants',()=>{
 assert.equal(getUtcInstant('2026-11-01T01:30:00-04:00'),'2026-11-01T05:30:00.000Z');
 assert.equal(getUtcInstant('2026-11-01T01:30:00-05:00'),'2026-11-01T06:30:00.000Z');
});
test('never silently interpret zone-free, overflow, or unknown-offset timestamps',()=>{
 for(const value of ['2026-11-01T01:30:00','2026-02-30T01:30:00Z','2026-11-01T24:30:00Z',
 '2026-11-01T01:30:00-00:00','2026-11-01T01:30:00+14:01','not-a-date'])
  assert.equal(getUtcInstant(value),null,value);
});
test('monotonic event identities survive repeated creation in same millisecond and collisions',()=>{
 const first=allocateEventId(1,['rss-plan','local-1']);
 assert.deepEqual(first,{id:'local-2',nextSequence:3});
 const second=allocateEventId(first.nextSequence,['local-2']);
 assert.equal(second.id,'local-3');
});
