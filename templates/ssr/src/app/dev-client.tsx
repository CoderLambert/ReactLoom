'use client'

import { useEffect } from 'react'

// Browser mocks and the React axe logger. Both stay out of production builds.
export function DevClient() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEVTOOLS === 'false') {
      return
    }
    if (process.env.NEXT_PUBLIC_ENABLE_MSW === 'true') {
      void import('@/mocks/browser').then(({ worker }) => {
        return worker.start({ onUnhandledFrame: 'bypass' })
      })
    }
    void import('@axe-core/react').then(async (axe) => {
      const React = await import('react')
      const ReactDOM = await import('react-dom')
      await axe.default(React, ReactDOM, 1000)
    })
  }, [])
  return null
}
