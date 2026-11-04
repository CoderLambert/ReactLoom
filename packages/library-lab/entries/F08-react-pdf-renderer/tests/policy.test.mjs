import test from 'node:test';
import assert from 'node:assert/strict';
import { validatedRows } from '../examples/report-policy.mjs';

const row = { id: 'react', name: 'React Notes', articles: 18 };
test('accepts bounded fixture and strips untrusted extra fields', () => {
  assert.deepEqual(validatedRows([{ ...row, secret: 'must not enter PDF' }]), [row]);
});
test('rejects non-record rows and wrong ID types', () => {
  for (const value of [null, 3, [], { ...row, id: 7 }]) {
    assert.throws(() => validatedRows([value]), Error);
  }
});
test('detects duplicate IDs case-insensitively', () => {
  assert.throws(() => validatedRows([row, { ...row, id: 'REACT' }]), /Duplicate/);
});
test('rejects markup, non-ASCII and control characters in names', () => {
  for (const name of ['', '中文', 'hello\nworld', 'x'.repeat(71)]) {
    assert.throws(() => validatedRows([{ ...row, name }]), /ASCII/);
  }
});
test('rejects invalid row count and unsafe numeric bounds', () => {
  assert.throws(() => validatedRows([]), /Row count/);
  assert.throws(() => validatedRows(Array(141).fill(row)), /Row count/);
  for (const articles of [-1, 1.5, Infinity, 1_000_001]) {
    assert.throws(() => validatedRows([{ ...row, articles }]), /article count/);
  }
});
