import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { assertTaskForUser, assertTasksForUser, TaskSessionMismatchError } from './task-ownership'

const own = { id: 'task-1', ownerId: 'user-ada' }
const foreign = { id: 'task-2', ownerId: 'someone-else' }

describe('task response session boundary', () => {
  it('preserves a matching task and an empty or matching task list', () => {
    expect(assertTaskForUser(own, 'user-ada')).toBe(own)
    const tasks = { ownerId: 'user-ada', tasks: [own] }
    expect(assertTasksForUser(tasks, 'user-ada')).toBe(tasks)
    const empty = { ownerId: 'user-ada', tasks: [] }
    expect(assertTasksForUser(empty, 'user-ada')).toBe(empty)
  })

  it('rejects foreign mutation results and mixed-owner lists', () => {
    expect(() => assertTaskForUser(foreign, 'user-ada')).toThrow(TaskSessionMismatchError)
    expect(() =>
      assertTasksForUser({ ownerId: 'user-ada', tasks: [own, foreign] }, 'user-ada'),
    ).toThrow(TaskSessionMismatchError)
  })

  it('rejects a foreign-account GET before it enters the Query cache', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await expect(
      client.fetchQuery({
        queryKey: ['tasks', 'user-ada'],
        queryFn: async () =>
          assertTasksForUser({ ownerId: 'someone-else', tasks: [foreign] }, 'user-ada'),
      }),
    ).rejects.toBeInstanceOf(TaskSessionMismatchError)
    expect(client.getQueryData(['tasks', 'user-ada'])).toBeUndefined()
    client.clear()
  })

  it('rejects an empty list from a replaced cookie session before caching it', async () => {
    // No task item exists to expose a mismatched ownerId, so the envelope
    // itself must identify the authenticated owner.
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await expect(
      client.fetchQuery({
        queryKey: ['tasks', 'user-ada'],
        queryFn: async () => assertTasksForUser({ ownerId: 'someone-else', tasks: [] }, 'user-ada'),
      }),
    ).rejects.toBeInstanceOf(TaskSessionMismatchError)
    expect(client.getQueryData(['tasks', 'user-ada'])).toBeUndefined()
    client.clear()
  })
})
