import test from 'node:test';
import assert from 'node:assert/strict';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import {resolveExplicitZonedInstant} from '../examples/offset-instant.mjs';
dayjs.extend(utc);dayjs.extend(timezone);dayjs.extend(customParseFormat);
const fmt='YYYY-MM-DD HH:mm';
function noon(day,zone){return dayjs.tz(day+' 12:00',fmt,zone);}
test('actual Day.js strict format rejects calendar overflow',()=>{
 assert.equal(dayjs('2026-02-30','YYYY-MM-DD',true).isValid(),false);
 assert.equal(dayjs('2026-02-28','YYYY-MM-DD',true).isValid(),true);
});
test('real timezone plugin resolves NY noon 23h and 25h DST',()=>{
 assert.equal(noon('2026-03-08','America/New_York').diff(noon('2026-03-07','America/New_York'),'hour',true),23);
 assert.equal(noon('2026-11-01','America/New_York').diff(noon('2026-10-31','America/New_York'),'hour',true),25);
});
test('distinct UTC instants survive same wall clock with different offsets',()=>{
 const first=dayjs.utc('2026-11-01T05:30:00Z').tz('America/New_York');
 const second=dayjs.utc('2026-11-01T06:30:00Z').tz('America/New_York');
 assert.equal(first.format('HH:mm'),second.format('HH:mm'));
 assert.notEqual(first.format('Z'),second.format('Z'));
});

test('actual Day.js accepts both disambiguated fall-back instants',()=>{
 const first=resolveExplicitZonedInstant('2026-11-01T01:30:00-04:00','America/New_York');
 const second=resolveExplicitZonedInstant('2026-11-01T01:30:00-05:00','America/New_York');
 assert.equal(first.instant,'2026-11-01T05:30:00.000Z');
 assert.equal(second.instant,'2026-11-01T06:30:00.000Z');
});
test('actual Day.js rejects mismatched offsets and spring-forward wall gaps',()=>{
 for(const input of ['2026-03-08T02:30:00-05:00','2026-11-01T01:30:00-06:00',
   '2026-11-01T01:30:00','2026-02-30T10:00:00-05:00']) {
   assert.throws(()=>resolveExplicitZonedInstant(input,'America/New_York'));
 }
});
