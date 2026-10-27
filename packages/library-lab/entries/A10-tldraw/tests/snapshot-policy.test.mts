import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { serializeSnapshot } from '../examples/snapshot-policy.ts';

test('serializes a real serializable document without changing values', () => {
  const input = { shapes: [{ x: 4, label: '中文' }], version: 1 };
  assert.deepEqual(JSON.parse(serializeSnapshot(input)), input);
});
test('rejects missing document and circular references', () => {
  assert.throws(() => serializeSnapshot(undefined), /没有可导出/);
  const data: { self?: unknown } = {};
  data.self = data;
  assert.throws(() => serializeSnapshot(data), /circular/i);
});
test('counts UTF-8 bytes, not JS string code units, for maximum size', () => {
  assert.throws(() => serializeSnapshot({ data: '中'.repeat(1_100_000) }), /3 MB/);
  assert.equal(JSON.parse(serializeSnapshot({ data: 'abc' })).data, 'abc');
});
