import * as z from 'zod'
import { privateJson } from '@/server/private-response'
import { mutationRequestError } from '@/server/mutation-request'
import { readRequestSession } from '@/server/session'
import { tasks } from '@/server/tasks'

const createSchema = z.object({ title: z.string().trim().min(3).max(80) })

export async function GET() {
  const user = await readRequestSession()
  if (!user) return privateJson({ message: 'Sign in is required.' }, 401)
  return privateJson({ tasks: tasks.list(user.id) })
}

export async function POST(request: Request) {
  const error = mutationRequestError(request, true)
  if (error) return error
  const user = await readRequestSession()
  if (!user) return privateJson({ message: 'Sign in is required.' }, 401)
  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success)
    return privateJson({ message: 'Give the task a title.' }, 400)
  return privateJson(tasks.create(user.id, parsed.data.title), { status: 201 })
}
