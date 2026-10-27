import test from 'node:test';
import assert from 'node:assert/strict';
import {addDays,differenceInCalendarDays,differenceInHours,format,parseISO,isValid} from 'date-fns';
import {assertExplicitInstant} from '../examples/instant-policy.mjs';
import {TZDate,tz} from '@date-fns/tz';
const zone='America/New_York';
test('actual date-fns: NY spring DST means 1 calendar day but 23 hours',()=>{
 const start=new TZDate(2026,2,7,12,0,0,zone);
 const end=addDays(start,1,{in:tz(zone)});
 assert.equal(format(end,'yyyy-MM-dd',{in:tz(zone)}),'2026-03-08');
 assert.equal(differenceInCalendarDays(end,start,{in:tz(zone)}),1);
 assert.equal(differenceInHours(end,start),23);
});
test('actual date-fns: NY autumn DST means 1 calendar day but 25 hours',()=>{
 const start=new TZDate(2026,9,31,12,0,0,zone);
 const end=addDays(start,1,{in:tz(zone)});
 assert.equal(differenceInCalendarDays(end,start,{in:tz(zone)}),1);
 assert.equal(differenceInHours(end,start),25);
});

test('actual date-fns parses explicit fall-back instants without guessing the offset',()=>{
 const first=parseISO(assertExplicitInstant('2026-11-01T01:30:00-04:00'));
 const second=parseISO(assertExplicitInstant('2026-11-01T01:30:00-05:00'));
 assert.ok(isValid(first)&&isValid(second));
 assert.equal(second.getTime()-first.getTime(),3600000);
 assert.throws(()=>assertExplicitInstant('2026-11-01T01:30:00'));
 assert.throws(()=>assertExplicitInstant('2026-03-08T24:00:00Z'));
});
