import { describe, expect, it } from 'vitest'
import { createTaskRepository } from './repository'

describe('task repository', () => {
  it('prepends a task and updates its status', () => {
    const repository = createTaskRepository([
      { id: 'task-1', title: 'Dress the loom', status: 'open' },
    ])
    repository.create('Beat the weft')
    expect(repository.list()[0]?.title).toBe('Beat the weft')
    repository.setStatus('task-1', 'done')
    expect(repository.list().find((task) => task.id === 'task-1')?.status).toBe('done')
  })
})
