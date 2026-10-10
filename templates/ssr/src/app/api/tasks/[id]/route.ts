import { NextResponse } from 'next/server'
import * as z from 'zod'
import { readRequestSession } from '@/server/session'
import { tasks } from '@/server/tasks'

const statusSchema = z.object({ status: z.enum(['open', 'done']) })

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await readRequestSession()
  if (!user) return NextResponse.json({ message: 'Sign in is required.' }, { status: 401 })
  const { id } = await context.params
  const parsed = statusSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: 'Unknown status.' }, { status: 400 })
  const task = tasks.setStatus(user.id, id, parsed.data.status)
  if (!task) return NextResponse.json({ message: 'Task not found.' }, { status: 404 })
  return NextResponse.json(task)
}
