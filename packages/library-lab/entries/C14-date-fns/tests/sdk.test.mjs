import test from 'node:test';
import assert from 'node:assert/strict';
import {addDays,differenceInCalendarDays,differenceInHours,format} from 'date-fns';
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
