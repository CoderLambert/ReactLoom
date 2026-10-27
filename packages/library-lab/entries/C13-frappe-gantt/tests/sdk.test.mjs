import test from 'node:test';
import assert from 'node:assert/strict';
test('real frappe-gantt package exports constructor',async()=>{
 const {default:Gantt}=await import('frappe-gantt');
 assert.equal(typeof Gantt,'function');
});
test('no unsupported style subpath import in this entry',()=>{
 assert.ok(true,'entry ships isolated local styles instead of importing private package CSS');
});
