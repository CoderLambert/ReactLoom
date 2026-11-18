import assert from 'node:assert/strict'
import test from 'node:test'
import { releaseNativeMedia } from './media-cleanup.mjs'

// Native API doubles are policy/control-flow evidence, not Video.js/media SDK execution.
test('owned native cleanup pauses, drops src and reloads in order', () => {
  const calls = []
  assert.deepEqual(
    releaseNativeMedia({
      pause() {
        calls.push('pause')
      },
      removeAttribute(name) {
        calls.push(name)
      },
      load() {
        calls.push('load')
      },
    }),
    [],
  )
  assert.deepEqual(calls, ['pause', 'src', 'load'])
})
test('pause failure does not skip src/load release attempts', () => {
  const calls = []
  const errors = releaseNativeMedia({
    pause() {
      throw new Error('test')
    },
    removeAttribute(name) {
      calls.push(name)
    },
    load() {
      calls.push('load')
    },
  })
  assert.deepEqual(calls, ['src', 'load'])
  assert.equal(errors.length, 1)
})
