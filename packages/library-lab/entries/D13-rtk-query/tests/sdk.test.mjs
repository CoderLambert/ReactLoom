import assert from 'node:assert/strict'
import test from 'node:test'
import { createDemoRuntime } from '../examples/runtime.ts'

test('actual demo runtime deduplicates subscribers and retains distinct argument caches', async () => {
  const r = createDemoRuntime()
  r.setDelay(1)
  const a = r.store.dispatch(r.api.endpoints.list.initiate({ tenant: 'team-a', search: '' }))
  const second = r.store.dispatch(r.api.endpoints.list.initiate({ tenant: 'team-a', search: '' }))
  const b = r.store.dispatch(r.api.endpoints.list.initiate({ tenant: 'team-b', search: '' }))
  try {
    const [left, right] = await Promise.all([a.unwrap(), b.unwrap(), second.unwrap()])
    assert.equal(left[0].title, '科技日报')
    assert.equal(right[0].title, '安全研究')
    assert.deepEqual(r.inspect().reads, { 'team-a': 1, 'team-b': 1 })
    assert.equal(r.inspect().queries.length, 2)
    const cached = r.store.dispatch(r.api.endpoints.list.initiate({ tenant: 'team-a', search: '' }))
    await cached.unwrap()
    cached.unsubscribe()
    assert.equal(r.inspect().reads['team-a'], 1)
  } finally {
    a.unsubscribe()
    second.unsubscribe()
    b.unsubscribe()
    r.dispose()
  }
  assert.equal(r.inspect().queries.length, 0)
})

test('actual demo success invalidates own tenant while 409 and 404 do not refetch', async () => {
  const r = createDemoRuntime()
  r.setDelay(1)
  const a = r.store.dispatch(r.api.endpoints.list.initiate({ tenant: 'team-a', search: '' }))
  const b = r.store.dispatch(r.api.endpoints.list.initiate({ tenant: 'team-b', search: '' }))
  try {
    await Promise.all([a.unwrap(), b.unwrap()])
    await r.store
      .dispatch(r.api.endpoints.toggle.initiate({ tenant: 'team-a', id: 'news' }))
      .unwrap()
    await Promise.all(r.store.dispatch(r.api.util.getRunningQueriesThunk()))
    assert.deepEqual(r.inspect().reads, { 'team-a': 2, 'team-b': 1 })
    const state = r.api.endpoints.list.select({ tenant: 'team-a', search: '' })(r.store.getState())
    assert.equal(state.data[0].paused, true)
    await assert.rejects(
      r.store
        .dispatch(r.api.endpoints.toggle.initiate({ tenant: 'team-b', id: 'conflict' }))
        .unwrap(),
      (e) => e.status === 409,
    )
    await assert.rejects(
      r.store
        .dispatch(r.api.endpoints.toggle.initiate({ tenant: 'team-b', id: 'missing' }))
        .unwrap(),
      (e) => e.status === 404,
    )
    await Promise.all(r.store.dispatch(r.api.util.getRunningQueriesThunk()))
    assert.deepEqual(r.inspect().reads, { 'team-a': 2, 'team-b': 1 })
    assert.equal(
      r.api.endpoints.list
        .select({ tenant: 'team-b', search: '' })(r.store.getState())
        .data.find((x) => x.id === 'conflict').paused,
      false,
    )
  } finally {
    a.unsubscribe()
    b.unsubscribe()
    r.dispose()
  }
})

test('actual runtime disposal aborts pending mutation before fixture write and clears cache', async () => {
  const r = createDemoRuntime()
  r.setDelay(30)
  const mutation = r.store.dispatch(
    r.api.endpoints.toggle.initiate({ tenant: 'team-a', id: 'news' }),
  )
  const query = r.store.dispatch(r.api.endpoints.list.initiate({ tenant: 'team-b', search: '' }))
  r.dispose()
  await assert.rejects(mutation.unwrap())
  await query
  // resetApiState removes the selected query; unwrap may resolve undefined after reset.
  await new Promise((resolve) => setTimeout(resolve, 40))
  assert.equal(r.inspect().active, 0)
  assert.equal(r.inspect().queries.length, 0)
  r.setDelay(1)
  const result = r.store.dispatch(r.api.endpoints.list.initiate({ tenant: 'team-a', search: '' }))
  try {
    assert.equal((await result.unwrap())[0].paused, false)
  } finally {
    result.unsubscribe()
    r.dispose()
  }
})
