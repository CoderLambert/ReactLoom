import assert from 'node:assert/strict'
import test from 'node:test'
import { createStore } from 'jotai'
import {
  counterAtom,
  doubleAtom,
  storiesAtom,
  toggleReadAtom,
  unreadAtom,
} from '../examples/workspace-atoms.mjs'

test('actual demo derived atom follows source; unsubscribe stops notifications', () => {
  const store = createStore()
  let calls = 0
  const unsub = store.sub(doubleAtom, () => {
    calls++
  })
  assert.equal(store.get(doubleAtom), 0)
  store.set(counterAtom, 4)
  assert.equal(store.get(doubleAtom), 8)
  assert.ok(calls >= 1)
  unsub()
  const before = calls
  store.set(counterAtom, 5)
  assert.equal(calls, before)
})

test('actual demo write atom and derived unread isolate sibling and new session stores', () => {
  const a = createStore(),
    b = createStore()
  const initial = a.get(storiesAtom)
  a.set(counterAtom, 3)
  a.set(toggleReadAtom, 'rss-1')
  assert.equal(a.get(unreadAtom), 1)
  assert.equal(b.get(unreadAtom), 2)
  assert.equal(initial[0].read, false)
  assert.equal(a.get(storiesAtom)[1], initial[1])
  const current = a.get(storiesAtom)
  a.set(toggleReadAtom, 'missing')
  assert.equal(a.get(storiesAtom), current)
  const fresh = createStore()
  assert.equal(fresh.get(counterAtom), 0)
  assert.equal(fresh.get(unreadAtom), 2)
  assert.equal(a.get(counterAtom), 3)
})

test('actual write atom rejects duplicate IDs before changing store snapshot', () => {
  const store = createStore()
  const invalid = [
    { id: 'same', title: 'one', read: false },
    { id: 'same', title: 'two', read: true },
  ]
  store.set(storiesAtom, invalid)
  assert.throws(() => store.set(toggleReadAtom, 'same'), TypeError)
  assert.equal(store.get(storiesAtom), invalid)
  assert.equal(invalid[0].read, false)
})
