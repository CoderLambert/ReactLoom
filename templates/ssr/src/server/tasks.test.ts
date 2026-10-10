import { describe, expect, it } from 'vitest'
import { createTaskRepository } from './tasks'

describe('task repository', () => {
  it('scopes tasks to the signed-in owner', () => {
    const repository = createTaskRepository({ tasks: [], sequence: 0 })
    const created = repository.create('user-ada', 'Beat the weft')
    expect(repository.list('user-ada')).toEqual([created])
    expect(repository.list('someone-else')).toEqual([])
    expect(repository.setStatus('user-ada', created.id, 'done')?.status).toBe('done')
  })
})
