import test from 'node:test';
import assert from 'node:assert/strict';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
test('real FullCalendar v7 plugin entry points import',()=>{
 assert.ok(dayGridPlugin);assert.ok(timeGridPlugin);
});
test('DST duplicate wall time maps to two distinct instants',()=>{
 const early=new Date('2026-11-01T01:30:00-04:00');
 const late=new Date('2026-11-01T01:30:00-05:00');
 assert.equal((late-early)/3_600_000,1);
 assert.equal(early.toISOString(),'2026-11-01T05:30:00.000Z');
});
