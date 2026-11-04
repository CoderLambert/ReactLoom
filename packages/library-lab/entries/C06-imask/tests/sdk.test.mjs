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
test('IMask separates normalized numeric data from optional fixed-scale display', () => {
 const options={mask:Number,radix:'.',scale:2,thousandsSeparator:','};
 const amount=IMask.createMask(options);
 amount.resolve('1234.50');
 assert.equal(amount.value,'1,234.5');
 assert.equal(amount.unmaskedValue,'1234.5');
 assert.equal(amount.typedValue,1234.5);
 const padded=IMask.createMask({...options,padFractionalZeros:true});
 padded.resolve('1234.5');
 assert.equal(padded.value,'1,234.50');
 assert.equal(padded.unmaskedValue,'1234.5', 'display padding does not change normalized data');
 assert.equal(padded.typedValue,amount.typedValue);
});
