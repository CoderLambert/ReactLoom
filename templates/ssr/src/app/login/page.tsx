'use client'

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { getApi } from '@/lib/api'
import { clearSessionCache } from '@/lib/session-cache'
import { broadcastSessionEvent } from '@/lib/session-events'

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

const responseSchema = z.object({
  user: z.object({ id: z.string(), email: z.email(), name: z.string() }),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <form
      className="mx-auto max-w-md space-y-4 rounded-3xl bg-card p-6 ring-1 ring-line"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null)
        try {
          await getApi().request('/api/session', responseSchema, {
            method: 'POST',
            body: values,
            retry: false,
          })
          await clearSessionCache(queryClient)
          broadcastSessionEvent('signed-in')
          router.push('/tasks')
          router.refresh()
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'Sign in failed.')
        }
      })}
    >
      <h1 className="text-4xl">Sign in</h1>
      <p className="text-sm text-muted">Fixture account: ada@reactloom.dev / loom-demo</p>
      <label className="block space-y-2 text-sm font-semibold" htmlFor="email">
        Email
        <input
          id="email"
          type="email"
          autoComplete="username"
          className="w-full rounded-2xl bg-linen px-3 py-2 font-normal ring-1 ring-line"
          {...form.register('email')}
        />
      </label>
      <label className="block space-y-2 text-sm font-semibold" htmlFor="password">
        Password
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-2xl bg-linen px-3 py-2 font-normal ring-1 ring-line"
          {...form.register('password')}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-copper">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-linen"
      >
        Sign in
      </button>
    </form>
  )
}
