import test from 'node:test';
import assert from 'node:assert/strict';
import {DateTime,Interval} from 'luxon';
import {resolveWallTime} from '../examples/wall-time.mjs';
function noon(date){return DateTime.fromISO(date+'T12:00:00',{zone:'America/New_York'});}
test('real Luxon reports invalid civil input',()=>{
 assert.equal(DateTime.fromISO('2026-02-30T12:00:00',{zone:'UTC'}).isValid,false);
});
test('Luxon calendar-day increment differs from elapsed 24 hours across DST',()=>{
 for(const [day,hours] of [['2026-03-07',23],['2026-10-31',25]]){
   const start=noon(day),end=start.plus({days:1});
   assert.equal(Interval.fromDateTimes(start,end).length('hours'),hours);
   assert.equal(start.hour,end.hour);
 }
});
test('real Luxon exposes both possible offsets for repeated local time',()=>{
 const value=DateTime.fromISO('2026-11-01T01:30:00',{zone:'America/New_York'});
 const offsets=value.getPossibleOffsets();
 assert.equal(offsets.length,2);
 assert.deepEqual(offsets.map(d=>d.offset).sort((a,b)=>a-b),[-300,-240]);
});

test('actual Luxon rejects nonexistent spring-forward wall clock and implicit fallback',()=>{
 assert.throws(()=>resolveWallTime('2026-03-08T02:30','America/New_York'));
 assert.throws(()=>resolveWallTime('2026-11-01T01:30','America/New_York'));
});
test('actual Luxon resolves both fallback offsets to two exact instants',()=>{
 const early=resolveWallTime('2026-11-01T01:30','America/New_York','-04:00');
 const late=resolveWallTime('2026-11-01T01:30','America/New_York','-05:00');
 assert.equal(early.instant,'2026-11-01T05:30:00.000Z');
 assert.equal(late.instant,'2026-11-01T06:30:00.000Z');
 assert.throws(()=>resolveWallTime('2026-11-01T01:30','America/New_York','-06:00'));
});
