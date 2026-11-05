'use client'

import { isApiError } from '@reactloom/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import * as z from 'zod'
import { getApi } from '@/lib/api'
import { clearSessionCache } from '@/lib/session-cache'

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['open', 'done']),
  ownerId: z.string(),
  createdAt: z.string(),
})

const listSchema = z.object({ tasks: z.array(taskSchema) })
const logoutSchema = z.object({ ok: z.literal(true) })
const sessionSchema = z.object({
  user: z.object({ id: z.string(), email: z.string(), name: z.string() }),
})

export default function TasksPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const redirecting = useRef(false)
  const session = useQuery({
    queryKey: ['session'],
    queryFn: ({ signal }) =>
      getApi().request('/api/session', sessionSchema, { signal, retry: false }),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: false,
  })

  useEffect(() => {
    if (
      redirecting.current ||
      !session.isError ||
      !isApiError(session.error) ||
      session.error.code !== 'unauthorized'
    ) {
      return
    }
    redirecting.current = true
    void clearSessionCache(queryClient).then(() => {
      router.replace('/login')
      router.refresh()
    })
  }, [queryClient, router, session.error, session.isError])

  // Keep an unsent draft mounted, but do not show cached private data while
  // the httpOnly cookie is revalidated after a tab returns to the foreground.
  const verified = session.isSuccess && !session.isFetching
  return (
    <>
      {!verified ? (
        session.isError ? (
          <p role="alert">
            {session.error instanceof Error
              ? session.error.message
              : 'The session could not be checked.'}{' '}
            {isApiError(session.error) && session.error.code === 'unauthorized' ? null : (
              <button type="button" onClick={() => void session.refetch()}>
                Try again
              </button>
            )}
          </p>
        ) : (
          <p role="status">Checking session…</p>
        )
      ) : null}
      {session.data ? (
        <div hidden={!verified}>
          <AuthenticatedTasks key={session.data.user.id} userId={session.data.user.id} />
        </div>
      ) : null}
    </>
  )
}

function AuthenticatedTasks({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const draftRevision = useRef(0)
  const submitting = useRef(false)
  const tasks = useQuery({
    queryKey: ['tasks', userId],
    queryFn: ({ signal }) => getApi().request('/api/tasks', listSchema, { signal }),
  })
  const create = useMutation({
    mutationFn: ({ title: nextTitle }: { title: string; revision: number }) =>
      getApi().request('/api/tasks', taskSchema, {
        method: 'POST',
        body: { title: nextTitle },
        retry: false,
      }),
    onSuccess: (_task, submitted) => {
      if (draftRevision.current === submitted.revision) setTitle('')
    },
    onSettled: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
      } finally {
        submitting.current = false
      }
    },
  })

  async function signOut() {
    if (isSigningOut || create.isPending) return
    setIsSigningOut(true)
    setSignOutError(null)
    try {
      await getApi().request('/api/session', logoutSchema, { method: 'DELETE', retry: false })
      await clearSessionCache(queryClient)
      router.replace('/login')
      router.refresh()
    } catch (cause) {
      setSignOutError(cause instanceof Error ? cause.message : 'Sign out failed.')
      setIsSigningOut(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-5xl">Warp board</h1>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={isSigningOut || create.isPending}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-linen disabled:opacity-60"
        >
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
      {signOutError ? (
        <p role="alert" className="text-sm text-copper">
          {signOutError}
        </p>
      ) : null}
      <p className="text-muted">
        Loaded in the browser, authorized by the httpOnly session cookie.
      </p>
      <form
        aria-busy={create.isPending}
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          if (submitting.current || create.isPending) return
          const next = title.trim()
          if (next.length < 3) return
          submitting.current = true
          create.mutate({ title: next, revision: draftRevision.current })
        }}
      >
        <label className="grow space-y-2 text-sm font-semibold" htmlFor="title">
          Task title
          <input
            id="title"
            value={title}
            onChange={(event) => {
              draftRevision.current += 1
              setTitle(event.target.value)
            }}
            aria-describedby={create.isError ? 'create-task-error' : undefined}
            className="w-full rounded-2xl bg-card px-3 py-2 font-normal ring-1 ring-line"
          />
        </label>
        <button
          type="submit"
          disabled={create.isPending}
          className="self-end rounded-full bg-ink px-4 py-2 text-sm font-semibold text-linen disabled:opacity-60"
        >
          {create.isPending ? 'Adding task…' : create.isError ? 'Try again' : 'Add task'}
        </button>
      </form>
      {create.isError ? (
        <p id="create-task-error" role="alert" className="text-sm text-copper">
          {create.error instanceof Error ? create.error.message : 'The task could not be added.'}
        </p>
      ) : null}
      {tasks.isPending ? <p>Loading tasks…</p> : null}
      {tasks.isError ? (
        <p role="alert">
          {tasks.error instanceof Error
            ? tasks.error.message
            : 'The task list could not be loaded.'}{' '}
          <button type="button" onClick={() => tasks.refetch()}>
            Try again
          </button>
        </p>
      ) : null}
      <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-card ring-1 ring-line">
        {tasks.data?.tasks.map((task) => (
          <li key={task.id} className="px-4 py-3">
            {task.title}
          </li>
        ))}
      </ul>
    </section>
  )
}
