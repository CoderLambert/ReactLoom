'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const BrowserDevTools = dynamic(
  () => import('@/app/dev-browser-tools').then(({ BrowserDevTools }) => BrowserDevTools),
  { ssr: false },
)

// Browser mocks and the React axe logger. Both stay out of production builds.
export function DevClient() {
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEVTOOLS === 'false') {
    return null
  }

  return (
    <Suspense fallback={null}>
      <BrowserDevTools />
    </Suspense>
  )
}
