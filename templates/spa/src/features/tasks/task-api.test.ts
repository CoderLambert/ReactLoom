import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { setTaskStatus } from '@/features/tasks/api'
import { server } from '@/mocks/server'

describe('task API resource paths', () => {
  it.each(['team/42', '../session', 'task?admin=true', 'task#detail'])(
    'PATCH keeps the server-issued ID %s in one URL segment',
    async (id) => {
      let requestedUrl: string | undefined
      server.use(
        http.patch('*', ({ request }) => {
          requestedUrl = request.url
          return HttpResponse.json({
            id,
            title: 'Opaque task',
            status: 'done',
            createdAt: '2026-11-17T00:00:00.000Z',
          })
        }),
      )

      await expect(setTaskStatus(id, 'done')).resolves.toMatchObject({ id, status: 'done' })

      const actual = new URL(requestedUrl ?? 'http://invalid.example/')
      expect(actual.pathname).toBe(`/api/tasks/${encodeURIComponent(id)}`)
      expect(actual.search).toBe('')
      expect(actual.hash).toBe('')
    },
  )

  it.each(['', '.', '..'])('rejects invalid dot-only or empty task ID %s before fetch', (id) => {
    expect(() => setTaskStatus(id, 'done')).toThrow('Invalid task ID.')
  })
})
