import assert from 'node:assert/strict'
import test from 'node:test'
import { validateSources } from '../examples/transport.mjs'

test('custom validation rejects malformed and unsafe responses (not Ky schema support)', () => {
  for (const input of [
    null,
    {},
    Array(31).fill({}),
    [null],
    [{ id: 1, title: 'x', url: 'https://example.com' }],
    [{ id: 'x', title: 'x', url: 'bad' }],
    [{ id: 'x', title: 'x', url: 'http://example.com' }],
  ])
    assert.throws(() => validateSources(input))
  assert.deepEqual(validateSources([{ id: 'x', title: 'X', url: 'https://example.com' }]), [
    { id: 'x', title: 'X', url: 'https://example.com/' },
  ])
})
