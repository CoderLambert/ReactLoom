import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAmount, normalizeQuantity} from '../examples/amount-policy.mjs';
test('currency strings retain decimal scale without a Number round-trip', () => {
  assert.equal(normalizeAmount('单价', ' 1.0050 '), '1.0050');
  assert.equal(normalizeAmount('税率', '0.0001'), '0.0001');
});
test('rejects imprecise, negative, scientific and boundless values', () => {
  for (const value of [-1, '1e3', '-0.01', '+1', '01', '0.00001', '10000000000', '', 'NaN', 'Infinity', '1,000']) {
    assert.throws(() => normalizeAmount('单价', value), Error, String(value));
  }
});
test('quantity must be an exact positive bounded integer string', () => {
  assert.equal(normalizeQuantity('9999'), '9999');
  for (const value of [1, '0', '00', '-1', '1.5', '10000', ' 1', '1e3']) {
    assert.throws(() => normalizeQuantity(value), Error, String(value));
  }
});
