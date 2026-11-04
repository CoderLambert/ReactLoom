import { describe, expect, it } from 'vitest'
import { createTaskRepository } from './repository'

describe('task repository', () => {
  it('prepends a task and updates its status', async () => {
    const repository = createTaskRepository([
      { id: 'task-1', title: 'Dress the loom', status: 'open' },
    ])
    await repository.create('Beat the weft')
    expect((await repository.list())[0]?.title).toBe('Beat the weft')
    await repository.setStatus('task-1', 'done')
    expect((await repository.list()).find((task) => task.id === 'task-1')?.status).toBe('done')
  })

  it('keeps fixture changes inside the repository instance', async () => {
    const first = createTaskRepository()
    const second = createTaskRepository()
    await first.create('Private draft')
    expect(await second.list()).toEqual([])
  })
})
