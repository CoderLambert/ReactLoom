import assert from 'node:assert/strict'
import test from 'node:test'
import { QueryClient } from '@tanstack/react-query'
import { optimisticRow, rollbackRow } from '../examples/optimistic-policy.mjs'

test('actual QueryClient: tenant identity prevents cache aliasing', () => {
  const client = new QueryClient()
  client.setQueryData(['library-lab', 'team-a', 'feeds'], [{ id: 'a1' }])
  client.setQueryData(['library-lab', 'team-b', 'feeds'], [{ id: 'b1' }])
  assert.deepEqual(client.getQueryData(['library-lab', 'team-a', 'feeds']), [{ id: 'a1' }])
  assert.deepEqual(client.getQueryData(['library-lab', 'team-b', 'feeds']), [{ id: 'b1' }])
  client.clear()
})
test('actual QueryClient: cancelQueries aborts signal forwarded to queryFn', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let signalWasAborted = false
  const task = client.fetchQuery({
    queryKey: ['library-lab', 'slow'],
    queryFn: ({ signal }) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve('late'), 300)
        const stop = () => {
          clearTimeout(timer)
          signalWasAborted = true
          reject(new DOMException('cancelled', 'AbortError'))
        }
        signal.addEventListener('abort', stop, { once: true })
      }),
  })
  const settled = task.then(
    () => 'resolved',
    () => 'rejected',
  )
  await client.cancelQueries({ queryKey: ['library-lab', 'slow'] })
  assert.equal(signalWasAborted, true)
  assert.equal(await settled, 'rejected')
  client.clear()
})

test('actual QueryClient uses a scoped cache patch and targeted 409 rollback', () => {
  const client = new QueryClient()
  const keyA = ['library-lab', 'query-demo', 'team-a', 'feeds', '', '0']
  const keyB = ['library-lab', 'query-demo', 'team-b', 'feeds', '', '0']
  const origin = {
    page: 0,
    total: 2,
    items: [
      { id: 'a1', title: 'A', enabled: false, rev: 1 },
      { id: 'a2', title: 'Other', enabled: true, rev: 1 },
    ],
  }
  client.setQueryData(keyA, origin)
  client.setQueryData(keyB, {
    page: 0,
    total: 1,
    items: [{ id: 'b1', title: 'B', enabled: false, rev: 1 }],
  })
  client.setQueriesData({ queryKey: ['library-lab', 'query-demo', 'team-a', 'feeds'] }, (old) =>
    optimisticRow(old, { id: 'a1', enabled: true, expectedRev: 1, token: 9 }),
  )
  const changed = client.getQueryData(keyA)
  assert.equal(changed.items[0].enabled, true)
  assert.equal(changed.items[1].enabled, true)
  client.setQueryData(keyA, (old) =>
    rollbackRow(old, { id: 'a1', token: 9, previous: origin.items[0] }),
  )
  assert.deepEqual(client.getQueryData(keyA), origin)
  assert.equal(client.getQueryData(keyB).items[0].id, 'b1')
  client.clear()
})

// These checks use the actual Demo's key factory, options and in-memory backend.
const { createFixtureBackend } = await import('../examples/fixture-backend.ts')
const { keys } = await import('../examples/query-keys.ts')
const { sharedStatsOptions } = await import('../examples/shared-query.ts')

test('shared Demo options deduplicate a request, reuse fresh data and refetch after invalidation', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const backend = createFixtureBackend()
  const options = sharedStatsOptions(backend, 'team-a')
  try {
    const [first, second] = await Promise.all([
      client.fetchQuery(options),
      client.fetchQuery(options),
    ])
    assert.strictEqual(first, second)
    assert.deepEqual(first, { total: 9, enabled: 5, request: 1 })
    backend.addFixtureFeed('team-a')
    const cached = await client.fetchQuery(options)
    assert.strictEqual(cached, first)
    assert.equal(cached.total, 9)
    await client.invalidateQueries({ queryKey: keys.stats('team-a'), exact: true })
    assert.equal(client.getQueryState(keys.stats('team-a')).isInvalidated, true)
    const refreshed = await client.fetchQuery(options)
    assert.deepEqual(refreshed, { total: 10, enabled: 6, request: 2 })
    assert.equal(client.getQueryData(keys.stats('team-b')), undefined)
  } finally {
    client.clear()
  }
})

test('cancelling the actual fixture query ends fetching without manufacturing data', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const backend = createFixtureBackend()
  const key = keys.list('team-a', '', 0)
  try {
    const request = client.fetchQuery({
      queryKey: key,
      queryFn: ({ signal }) => backend.list('team-a', '', 0, signal, 900),
    })
    const outcome = request.then(
      () => 'resolved',
      () => 'cancelled',
    )
    await client.cancelQueries({ queryKey: key, exact: true })
    assert.equal(await outcome, 'cancelled')
    assert.equal(client.getQueryState(key).fetchStatus, 'idle')
    assert.equal(client.getQueryData(key), undefined)
  } finally {
    client.clear()
  }
})

test('actual fixture 409 can roll back one owned row and retry with authoritative revision', async () => {
  const client = new QueryClient()
  const backend = createFixtureBackend()
  const key = keys.list('team-a', '', 0)
  try {
    const origin = await backend.list('team-a', '', 0, new AbortController().signal, 0)
    client.setQueryData(key, origin)
    client.setQueryData(key, (old) =>
      optimisticRow(old, { id: 'a-1', enabled: false, expectedRev: 1, token: 1 }),
    )
    await assert.rejects(backend.toggle('team-a', 'a-1', false, 1, true), /409/u)
    client.setQueryData(key, (old) =>
      rollbackRow(old, { id: 'a-1', token: 1, previous: origin.items[0] }),
    )
    assert.deepEqual(client.getQueryData(key), origin)
    const saved = await backend.toggle('team-a', 'a-1', false, 1, false)
    assert.equal(saved.rev, 2)
    assert.equal(saved.enabled, false)
  } finally {
    client.clear()
  }
})
