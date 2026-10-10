// biome-ignore-all assist/source/organizeImports: React Scan must be the top-most import
import { ReactScan } from '@/app/react-scan'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Providers } from '@/app/providers'
import { env } from '@/server/env'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'ReactLoom',
  description: 'ReactLoom SSR template',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <ReactScan />
      <body>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-linen"
        >
          Skip to content
        </a>
        <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <a href="/" className="font-serif text-xl">
            {env.NEXT_PUBLIC_APP_NAME}
          </a>
          <nav aria-label="Primary" className="flex gap-4 text-sm">
            <a href="/">Home</a>
            <a href="/tasks">Tasks</a>
            <a href="/login">Sign in</a>
          </nav>
        </header>
        <Providers>
          <main id="content" className="mx-auto max-w-5xl px-5 pt-6 pb-20">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
