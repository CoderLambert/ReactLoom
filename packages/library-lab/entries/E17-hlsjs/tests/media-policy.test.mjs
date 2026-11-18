import assert from 'node:assert/strict'
import test from 'node:test'
import { disposePlayback, validLevel } from '../examples/media-policy.mjs'

test('cleanup double observes actual intended destroy/pause/src/load order, not SDK', () => {
  const calls = []
  const media = {
    onerror() {},
    pause() {
      calls.push('pause')
    },
    removeAttribute(name) {
      calls.push(`remove:${name}`)
    },
    load() {
      calls.push('load')
    },
  }
  disposePlayback(
    {
      destroy() {
        calls.push('destroy')
      },
    },
    media,
  )
  assert.deepEqual(calls, ['destroy', 'pause', 'remove:src', 'load'])
  assert.equal(media.onerror, null)
})
test('destroy failure still clears media resources', () => {
  const calls = []
  const media = {
    pause() {
      calls.push('pause')
    },
    removeAttribute() {
      calls.push('remove')
    },
    load() {
      calls.push('load')
    },
  }
  assert.throws(
    () =>
      disposePlayback(
        {
          destroy() {
            throw Error('fixture destroy failed')
          },
        },
        media,
      ),
    /fixture/,
  )
  assert.deepEqual(calls, ['pause', 'remove', 'load'])
})
test('quality accepts automatic or present integer levels only', () => {
  for (const index of [-2, 0.5, NaN, 3]) assert.equal(validLevel(index, 3), false)
  for (const index of [-1, 0, 2]) assert.equal(validLevel(index, 3), true)
})
