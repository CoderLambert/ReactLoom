import assert from 'node:assert/strict'
import test from 'node:test'
import { createChannelStore, KEY, makeMemoryStorage } from '../examples/store.mjs'

test('actual example factories isolate stores, tenant keys and private storage', async () => {
  const a = makeMemoryStorage(),
    b = makeMemoryStorage()
  const first = createChannelStore(a.storage),
    second = createChannelStore(b.storage)
  first.getState().toggle()
  first.getState().setTenant('team-b')
  first.getState().toggle()
  first.getState().setView('grid')
  assert.deepEqual(first.getState().enabledByTenant, { 'team-a': false, 'team-b': true })
  assert.deepEqual(second.getState().enabledByTenant, { 'team-a': true, 'team-b': false })
  assert.equal(b.inspect(), '未写入')
  const saved = JSON.parse(a.inspect())
  assert.deepEqual(Object.keys(saved.state).sort(), ['enabledByTenant', 'view'])
  const restored = createChannelStore(a.storage)
  await restored.persist.rehydrate()
  assert.equal(restored.getState().tenant, 'team-a')
  assert.equal(restored.getState().view, 'grid')
  a.dispose()
  assert.equal(a.storage.getItem(KEY), null)
  const clean = createChannelStore(a.storage)
  await clean.persist.rehydrate()
  assert.equal(clean.getState().view, 'list')
})
test('actual store subscription stops after disposal of consumer', () => {
  const store = createChannelStore(makeMemoryStorage().storage)
  let calls = 0
  const unsubscribe = store.subscribe(() => calls++)
  store.getState().toggle()
  assert.equal(calls, 1)
  unsubscribe()
  store.getState().toggle()
  assert.equal(calls, 1)
})
test('actual example persist invokes controlled v1 migration and writes version 2', async () => {
  const memory = makeMemoryStorage()
  memory.seed(
    JSON.stringify({ state: { enabled: false, view: 'grid', token: 'secret' }, version: 1 }),
  )
  const store = createChannelStore(memory.storage)
  await store.persist.rehydrate()
  assert.deepEqual(store.getState().enabledByTenant, { 'team-a': false, 'team-b': false })
  assert.equal(store.getState().view, 'grid')
  assert.equal(JSON.parse(memory.inspect()).version, 2)
  assert.equal(memory.inspect().includes('secret'), false)
})
test('invalid JSON reports hydration error and retains defaults rather than invoking migrate', async () => {
  const memory = makeMemoryStorage()
  memory.seed('{broken')
  const store = createChannelStore(memory.storage)
  await store.persist.rehydrate()
  assert.equal(store.persist.hasHydrated(), false)
  assert.equal(store.getState().view, 'list')
  memory.dispose()
  await store.persist.rehydrate()
  assert.equal(store.persist.hasHydrated(), true)
})
