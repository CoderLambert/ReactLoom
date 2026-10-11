'use client'

import { useEffect } from 'react'

let mockWorkerStart: Promise<unknown> | undefined
let axeStart: Promise<unknown> | undefined

function startMockWorker() {
  if (!mockWorkerStart) {
    mockWorkerStart = import('@/mocks/browser').then(({ worker }) =>
      worker.start({ onUnhandledFrame: 'bypass' }),
    )
  }
  return mockWorkerStart
}

function startAxe() {
  if (!axeStart) {
    axeStart = import('@axe-core/react').then(async (axe) => {
      const React = { ...(await import('react')) }
      const ReactDOM = await import('react-dom')
      await axe.default(React, ReactDOM, 1000, {
        rules: [
          {
            // TanStack Devtools starts its internal sections at h3/h4, outside
            // the application's heading hierarchy.
            id: 'heading-order',
            enabled: false,
          },
          {
            // TanStack Devtools adds its own banner to the document. Playwright
            // still checks this rule without development overlays.
            id: 'landmark-no-duplicate-banner',
            enabled: false,
          },
          {
            // The same overlay renders visible controls outside the app landmarks.
            // Production-like Playwright runs still enforce landmark containment.
            id: 'region',
            enabled: false,
          },
        ],
      })
    })
  }
  return axeStart
}

// This component is loaded with `ssr: false` so browser-only development
// packages never enter Next.js's server compilation graph.
export function BrowserDevTools() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEVTOOLS === 'false') {
      return
    }
    if (process.env.NEXT_PUBLIC_ENABLE_MSW === 'true') {
      void startMockWorker()
    }
    void startAxe()
  }, [])

  return null
}
