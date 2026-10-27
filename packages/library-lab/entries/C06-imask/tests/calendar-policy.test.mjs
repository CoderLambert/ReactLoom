import test from 'node:test';
import assert from 'node:assert/strict';
import {validCalendarDay} from '../examples/calendar-policy.mjs';
test('year 0096 is not silently remapped to 1996',()=>{
 assert.equal(validCalendarDay('0096-02-29'),true);
 assert.equal(validCalendarDay('0099-12-31'),true);
 assert.equal(validCalendarDay('0100-02-29'),false);
});
test('Gregorian leap years and invalid days',()=>{
 assert.equal(validCalendarDay('2000-02-29'),true);
 assert.equal(validCalendarDay('1900-02-29'),false);
 assert.equal(validCalendarDay('2026-02-30'),false);
 assert.equal(validCalendarDay('2026-03-08'),true);
});
test('reject invalid calendar-only formats and astronomical year zero',()=>{
 for(const value of ['0000-01-01','2026-00-01','2026-13-01','2026-02-00','2026-02-31','2026-1-01','2026-01-01T00:00Z','']) assert.equal(validCalendarDay(value),false,value);
 assert.equal(validCalendarDay(null),false);
});

