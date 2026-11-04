import test from 'node:test';
import assert from 'node:assert/strict';
test('real frappe-gantt package exports constructor',async()=>{
 const {default:Gantt}=await import('frappe-gantt');
 assert.equal(typeof Gantt,'function');
});
