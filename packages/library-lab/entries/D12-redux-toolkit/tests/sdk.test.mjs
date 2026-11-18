import assert from 'node:assert/strict'
import test from 'node:test'
import { configureStore, createSlice } from '@reduxjs/toolkit'
import { actions, createFeedStore, feedsSlice, initialFeedState } from '../examples/store.mjs'

test('actual SDK exports and shipped action/reducer update immutably and isolate stores', () => {
  assert.equal(typeof configureStore, 'function')
  assert.equal(typeof createSlice, 'function')
  const a = createFeedStore(),
    b = createFeedStore()
  const before = a.getState()
  a.dispatch(actions.increment())
  assert.equal(actions.increment().type, 'labFeeds/increment')
  assert.notStrictEqual(a.getState(), before)
  assert.equal(before.feeds.counter, 0)
  assert.equal(a.getState().feeds.counter, 1)
  assert.equal(b.getState().feeds.counter, 0)
})

test('shipped reducers deduplicate stable IDs and update only matching feed', () => {
  const store = createFeedStore()
  store.dispatch(actions.addFeed({ id: 'A-1', title: 'First', read: false }))
  store.dispatch(actions.addFeed({ id: 'A-1', title: 'Duplicate', read: false }))
  store.dispatch(actions.toggleRead('missing'))
  assert.equal(store.getState().feeds.feeds.length, 1)
  assert.equal(store.getState().feeds.feeds[0].read, false)
  store.dispatch(actions.toggleRead('A-1'))
  assert.deepEqual(store.getState().feeds.feeds, [{ id: 'A-1', title: 'First', read: true }])
})

test('shipped request guard accepts newest response and counts late response', () => {
  const store = createFeedStore()
  store.dispatch(actions.startRequest('old'))
  store.dispatch(actions.startRequest('new'))
  store.dispatch(actions.finishRequest({ id: 'new', value: 'fresh' }))
  store.dispatch(actions.finishRequest({ id: 'old', value: 'stale' }))
  assert.equal(store.getState().feeds.result, 'fresh')
  assert.equal(store.getState().feeds.ignored, 1)
  assert.equal(store.getState().feeds.activeRequest, null)
})

test('guard also rejects old response arriving before newest, cancellation and reset remain scoped', () => {
  const a = createFeedStore(),
    b = createFeedStore()
  a.dispatch(actions.startRequest('old'))
  a.dispatch(actions.startRequest('new'))
  a.dispatch(actions.finishRequest({ id: 'old', value: 'stale' }))
  assert.equal(a.getState().feeds.activeRequest, 'new')
  a.dispatch(actions.cancelRequest())
  a.dispatch(actions.finishRequest({ id: 'new', value: 'cancelled' }))
  assert.equal(a.getState().feeds.result, '')
  assert.equal(a.getState().feeds.ignored, 2)
  b.dispatch(actions.increment())
  a.dispatch(actions.reset())
  assert.deepEqual(a.getState().feeds, initialFeedState())
  assert.equal(b.getState().feeds.counter, 1)
  assert.deepEqual(feedsSlice.reducer(undefined, { type: 'unknown' }), initialFeedState())
})
