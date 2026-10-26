import test from 'node:test';
import assert from 'node:assert/strict';
import IMask from 'imask';
test('IMask SDK formats a fixed 8-digit code', () => {
 const code=IMask.createMask({mask:'0000-0000'});
 code.resolve('12345678');
 assert.equal(code.value,'1234-5678');
 assert.equal(code.unmaskedValue,'12345678');
});
test('IMask SDK enforces the requested shape', () => {
 const code=IMask.createMask({mask:'0000-0000'});
 code.resolve('12a3b45678');
 assert.equal(code.unmaskedValue,'12345678');
});
test('IMask numeric mask is formatting, not decimal arithmetic', () => {
 const amount=IMask.createMask({mask:Number,radix:'.',scale:2});
 amount.resolve('1234.50');
 assert.equal(amount.unmaskedValue,'1234.50');
});
