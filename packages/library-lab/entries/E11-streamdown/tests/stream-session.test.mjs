import assert from 'node:assert/strict'
import test from 'node:test'
import { fixtures } from '../examples/fixtures.mjs'
import { initialSession, transitionSession } from '../examples/stream-session.mjs'

const chunks = fixtures.basic.chunks
const move = (state, type) => transitionSession(state, { type }, chunks)

test('manual deltas preserve the prefix and finish exactly at the final chunk', () => {
  let state = initialSession
  for (let received = 1; received <= chunks.length; received++) {
    state = move(state, 'next')
    assert.equal(state.markdown, chunks.slice(0, received).join(''))
    assert.equal(state.received, received)
  }
  assert.equal(state.status, 'completed')
  assert.equal(move(state, 'next'), state)
})

test('paused and ended sessions ignore late ticks; resume appends once', () => {
  let state = move(move(initialSession, 'start'), 'tick')
  state = move(state, 'pause')
  assert.equal(move(state, 'tick'), state)
  state = move(move(state, 'start'), 'tick')
  assert.equal(state.received, 2)
  state = move(state, 'end')
  assert.equal(state.status, 'ended')
  assert.equal(move(state, 'tick'), state)
  assert.equal(move(state, 'start'), state)
  assert.equal(move(state, 'reset'), initialSession)
  assert.equal(move(initialSession, 'tick'), initialSession)
})
