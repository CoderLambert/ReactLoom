'use client'

import { isApiError } from '@reactloom/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as z from 'zod'
import { getApi } from '@/lib/api'
import { clearSessionCache } from '@/lib/session-cache'
import { broadcastSessionEvent, subscribeSessionEvents } from '@/lib/session-events'

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
  const [revoked, setRevoked] = useState(false)
  const [checkingSessionEvent, setCheckingSessionEvent] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const sessionRevision = useRef(0)
  const handledUnauthorized = useRef<{ count: number; revision: number } | null>(null)
  const session = useQuery({
    queryKey: ['session'],
    queryFn: ({ signal }) =>
      getApi().request('/api/session', sessionSchema, { signal, retry: false }),
    staleTime: 0,
    // An open foreground tab must not retain private data indefinitely when a
    // cookie expires or is revoked outside this app (no BroadcastChannel event).
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: false,
  })

  const revokeSession = useCallback(() => {
    if (redirecting.current) return
    redirecting.current = true
    setRevoked(true)
    void clearSessionCache(queryClient).then(() => {
      router.replace('/login')
      router.refresh()
    })
  }, [queryClient, router])

  useEffect(() => {
    const revision = sessionRevision.current
    if (
      !session.isError ||
      !isApiError(session.error) ||
      session.error.code !== 'unauthorized' ||
      session.fetchStatus !== 'idle' ||
      (handledUnauthorized.current?.count === session.errorUpdateCount &&
        handledUnauthorized.current.revision === revision)
    ) {
      return
    }

    // errorUpdatedAt uses millisecond precision and may repeat for distinct
    // failures. Count each Query error and bind it to the current event revision.
    handledUnauthorized.current = { count: session.errorUpdateCount, revision }
    // A 401 may come from a request sent before another login changed the
    // shared cookie. Confirm it with a fresh request before revoking.
    let active = true
    setCheckingSessionEvent(true)
    setVerificationError(null)
    void getApi()
      .request('/api/session', sessionSchema, { retry: false })
      .then(
        (freshSession) => {
          if (!active || revision !== sessionRevision.current) return
          queryClient.setQueryData(['session'], freshSession)
          setCheckingSessionEvent(false)
        },
        (error: unknown) => {
          if (!active || revision !== sessionRevision.current) return
          if (isApiError(error) && error.code === 'unauthorized') {
            revokeSession()
          } else {
            setVerificationError(
              error instanceof Error ? error.message : 'The session could not be checked.',
            )
            setCheckingSessionEvent(false)
          }
        },
      )
    return () => {
      active = false
    }
  }, [
    queryClient,
    revokeSession,
    session.error,
    session.errorUpdateCount,
    session.fetchStatus,
    session.isError,
  ])

  useEffect(() => {
    let active = true
    let generation = 0
    const unsubscribe = subscribeSessionEvents(() => {
      // BroadcastChannel messages can arrive after a newer sign-in has replaced
      // the cookie. Neither event is proof of the current server session.
      const current = ++generation
      sessionRevision.current += 1
      setVerificationError(null)
      setCheckingSessionEvent(true)
      void session.refetch({ cancelRefetch: true }).then((result) => {
        if (!active || current !== generation) return
        // The unauthorized effect confirms any 401 with the current cookie;
        // this response alone may belong to an older session.
        if (!(result.isError && isApiError(result.error) && result.error.code === 'unauthorized')) {
          setCheckingSessionEvent(false)
        }
      })
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [session.refetch])

  // Keep an unsent draft mounted, but hide private data during verification
  // or as soon as another same-origin tab reports a successful sign-out.
  // A successful cached session is not verified while an offline refresh is
  // paused: isFetching is false in TanStack Query's 'paused' fetchStatus.
  const verified =
    !revoked && !checkingSessionEvent && session.isSuccess && session.fetchStatus === 'idle'
  return (
    <>
      {!verified ? (
        !checkingSessionEvent && session.isError ? (
          <p role="alert">
            {verificationError ??
              (session.error instanceof Error
                ? session.error.message
                : 'The session could not be checked.')}{' '}
            {!verificationError &&
            isApiError(session.error) &&
            session.error.code === 'unauthorized' ? null : (
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
      broadcastSessionEvent('signed-out')
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
      {isSigningOut ? <p role="status">Confirming sign-out…</p> : null}
      <p hidden={isSigningOut} className="text-muted">
        Loaded in the browser, authorized by the httpOnly session cookie.
      </p>
      <form
        hidden={isSigningOut}
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
        <p
          hidden={isSigningOut}
          id="create-task-error"
          role="alert"
          className="text-sm text-copper"
        >
          {create.error instanceof Error ? create.error.message : 'The task could not be added.'}
        </p>
      ) : null}
      {tasks.isPending ? <p hidden={isSigningOut}>Loading tasks…</p> : null}
      {tasks.isError ? (
        <p hidden={isSigningOut} role="alert">
          {tasks.error instanceof Error
            ? tasks.error.message
            : 'The task list could not be loaded.'}{' '}
          <button type="button" onClick={() => tasks.refetch()}>
            Try again
          </button>
        </p>
      ) : null}
      <ul
        hidden={isSigningOut}
        className="divide-y divide-line overflow-hidden rounded-3xl bg-card ring-1 ring-line"
      >
        {tasks.data?.tasks.map((task) => (
          <li key={task.id} className="px-4 py-3">
            {task.title}
          </li>
        ))}
      </ul>
    </section>
  )
}
