import * as z from 'zod'
import { mutationRequestError, taskMutationSessionError } from '@/server/mutation-request'
import { privateJson } from '@/server/private-response'
import { readMutationJson } from '@/server/mutation-json'
import { readRequestSession } from '@/server/session'
import { tasks } from '@/server/tasks'

const statusSchema = z.object({ status: z.enum(['open', 'done']) })

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const error = mutationRequestError(request, true)
  if (error) return error
  const user = await readRequestSession()
  if (!user) return privateJson({ message: 'Sign in is required.' }, 401)
  const sessionError = taskMutationSessionError(request, user.id)
  if (sessionError) return sessionError
  const { id } = await context.params
  const body = await readMutationJson(request)
  if (!body.ok && body.tooLarge) {
    return privateJson({ message: 'Request body is too large.' }, 413)
  }
  const parsed = statusSchema.safeParse(body.ok ? body.data : null)
  if (!parsed.success) return privateJson({ message: 'Unknown status.' }, 400)
  const task = tasks.setStatus(user.id, id, parsed.data.status)
  if (!task) return privateJson({ message: 'Task not found.' }, 404)
  return privateJson(task)
}
