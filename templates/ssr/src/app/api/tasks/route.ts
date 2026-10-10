import { NextResponse } from 'next/server'
import * as z from 'zod'
import { readRequestSession } from '@/server/session'
import { tasks } from '@/server/tasks'

const createSchema = z.object({ title: z.string().trim().min(3).max(80) })

export async function GET() {
  const user = await readRequestSession()
  if (!user) return NextResponse.json({ message: 'Sign in is required.' }, { status: 401 })
  return NextResponse.json({ tasks: tasks.list(user.id) })
}

export async function POST(request: Request) {
  const user = await readRequestSession()
  if (!user) return NextResponse.json({ message: 'Sign in is required.' }, { status: 401 })
  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success)
    return NextResponse.json({ message: 'Give the task a title.' }, { status: 400 })
  return NextResponse.json(tasks.create(user.id, parsed.data.title), { status: 201 })
}
