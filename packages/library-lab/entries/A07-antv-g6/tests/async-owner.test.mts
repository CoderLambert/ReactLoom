import assert from 'node:assert/strict'
import test from 'node:test'
import { createAsyncOwner } from '../examples/async-owner.ts'

test('tasks serialize while an older running task loses commit ownership', async () => {
  const events: string[] = []
  let release!: () => void
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  const owner = createAsyncOwner(() => {
    events.push('cleanup')
  })
  const first = owner.run(async (owns) => {
    events.push('first:start')
    await hold
    if (owns()) events.push('stale:commit')
    events.push('first:end')
  })
  await Promise.resolve()
  const second = owner.run(async (owns) => {
    assert(owns())
    events.push('second')
  })
  assert.deepEqual(events, ['first:start'])
  release()
  await Promise.all([first.finished, second.finished])
  assert.deepEqual(events, ['first:start', 'first:end', 'second'])
  await owner.dispose()
})
test('only latest queued intent executes before work begins', async () => {
  const events: string[] = []
  const owner = createAsyncOwner(() => {})
  const jobs = ['old', 'middle', 'latest'].map((name) =>
    owner.run(async () => {
      events.push(name)
    }),
  )
  await Promise.all(jobs.map((job) => job.finished))
  assert.deepEqual(events, ['latest'])
  await owner.dispose()
})
test('dispose invalidates pending UI immediately but cleans up after active work settles exactly once', async () => {
  let release!: () => void
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  let cleaned = 0,
    committed = false
  const owner = createAsyncOwner(() => {
    cleaned++
  })
  const job = owner.run(async (owns) => {
    await hold
    if (owns()) committed = true
  })
  await Promise.resolve()
  const disposal = owner.dispose()
  assert.equal(job.owns(), false)
  assert.equal(cleaned, 0)
  assert.equal(disposal, owner.dispose())
  release()
  await disposal
  assert.equal(committed, false)
  assert.equal(cleaned, 1)
  await owner.run(async () => {
    assert.fail('disposed task must not run')
  }).finished
})
test('failure is reported to its caller and cannot poison later serialized work or cleanup', async () => {
  const owner = createAsyncOwner(() => {})
  const failed = owner.run(async () => {
    throw new Error('local failure')
  })
  await assert.rejects(failed.finished, /local failure/)
  let completed = false
  await owner.run(async (owns) => {
    completed = owns()
  }).finished
  assert.equal(completed, true)
  await owner.dispose()
})
