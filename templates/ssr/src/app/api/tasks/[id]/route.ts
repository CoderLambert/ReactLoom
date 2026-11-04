import * as z from 'zod'
import { privateJson } from '@/server/private-response'
import { mutationRequestError } from '@/server/mutation-request'
import { readRequestSession } from '@/server/session'
import { tasks } from '@/server/tasks'

const statusSchema = z.object({ status: z.enum(['open', 'done']) })

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const error = mutationRequestError(request, true)
  if (error) return error
  const user = await readRequestSession()
  if (!user) return privateJson({ message: 'Sign in is required.' }, 401)
  const { id } = await context.params
  const parsed = statusSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return privateJson({ message: 'Unknown status.' }, 400)
  const task = tasks.setStatus(user.id, id, parsed.data.status)
  if (!task) return privateJson({ message: 'Task not found.' }, 404)
  return privateJson(task)
}
