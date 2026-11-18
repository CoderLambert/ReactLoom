import * as z from 'zod'
import { mutationRequestError, taskMutationSessionError } from '@/server/mutation-request'
import { privateJson } from '@/server/private-response'
import { readMutationJson } from '@/server/mutation-json'
import { readRequestSession } from '@/server/session'
import { tasks } from '@/server/tasks'

const createSchema = z.object({ title: z.string().trim().min(3).max(80) })

export async function GET() {
  const user = await readRequestSession()
  if (!user) return privateJson({ message: 'Sign in is required.' }, 401)
  return privateJson({ ownerId: user.id, tasks: tasks.list(user.id) })
}

export async function POST(request: Request) {
  const error = mutationRequestError(request, true)
  if (error) return error
  const user = await readRequestSession()
  if (!user) return privateJson({ message: 'Sign in is required.' }, 401)
  const sessionError = taskMutationSessionError(request, user.id)
  if (sessionError) return sessionError
  const body = await readMutationJson(request)
  if (!body.ok && body.tooLarge) {
    return privateJson({ message: 'Request body is too large.' }, 413)
  }
  const parsed = createSchema.safeParse(body.ok ? body.data : null)
  if (!parsed.success) return privateJson({ message: 'Give the task a title.' }, 400)
  return privateJson(tasks.create(user.id, parsed.data.title), 201)
}
