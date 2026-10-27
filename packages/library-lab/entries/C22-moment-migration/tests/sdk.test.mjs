import test from 'node:test';
import assert from 'node:assert/strict';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import {addDays,parseISO,isValid,format} from 'date-fns';
import {TZDate} from '@date-fns/tz';

dayjs.extend(customParseFormat);
test('actual Day.js strict parsing rejects invalid civil day',()=>{
 assert.equal(dayjs('2026-02-30','YYYY-MM-DD',true).isValid(),false);
 assert.equal(dayjs('2026-02-28','YYYY-MM-DD',true).isValid(),true);
});
test('actual date-fns formats a valid calendar date',()=>{
 const parsed=parseISO('2026-10-27');
 assert.equal(isValid(parsed),true);
 assert.equal(format(parsed,'yyyy-MM-dd'),'2026-10-27');
});
test('actual @date-fns/tz adds one NY civil day across spring DST in 23 real hours',()=>{
 const noon=new TZDate(2026,2,7,12,0,0,'America/New_York');
 assert.equal((addDays(noon,1).getTime()-noon.getTime())/3_600_000,23);
});
test('offset distinguishes fall DST repeated wall time without importing Moment',()=>{
 const early=new Date('2026-11-01T01:30:00-04:00');
 const late=new Date('2026-11-01T01:30:00-05:00');
 assert.equal((late.getTime()-early.getTime())/3_600_000,1);
});
