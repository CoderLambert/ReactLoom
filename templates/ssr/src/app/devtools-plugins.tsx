'use client'

import { LighthousePanel, ReactScanPanel } from '@reactloom/devtools/panels'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as z from 'zod'
import { reactScanController } from '@/app/react-scan'
import { Button } from '@/components/ui/button'
import { getApi } from '@/lib/api'

const stateSchema = z.object({
  running: z.boolean(),
  error: z.string().nullable(),
  report: z
    .object({
      url: z.string(),
      fetchedAt: z.string(),
      categories: z.array(
        z.object({ id: z.string(), title: z.string(), score: z.number().nullable() }),
      ),
      metrics: z.array(z.object({ title: z.string(), value: z.string() })),
      audits: z.array(z.object({ title: z.string(), value: z.string() })),
    })
    .nullable(),
})

export function ReactScanPlugin() {
  return <ReactScanPanel controller={reactScanController} Button={Button} />
}

export function LighthousePlugin() {
  const client = useQueryClient()
  const key = ['devtools', 'lighthouse'] as const
  const endpoint = '/api/devtools/lighthouse'
  const state = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => getApi().request(endpoint, stateSchema, { signal }),
    retry: false,
    refetchInterval: (query) => (query.state.data?.running ? 1000 : false),
  })
  const run = useMutation({
    mutationFn: () => getApi().request(endpoint, stateSchema, { method: 'POST', retry: false }),
    onSuccess: (next) => client.setQueryData(key, next),
  })
  const error = run.error || state.error
  return (
    <LighthousePanel
      Button={Button}
      state={state.data}
      loading={state.isPending || run.isPending}
      error={error instanceof Error ? error.message : null}
      onRun={() => run.mutate()}
      onRefresh={() => {
        run.reset()
        void state.refetch()
      }}
    />
  )
}
