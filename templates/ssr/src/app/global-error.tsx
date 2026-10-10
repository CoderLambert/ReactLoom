'use client'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main role="alert" className="mx-auto max-w-lg space-y-4 px-5 py-16">
          <h1>ReactLoom could not render.</h1>
          <p>{error.message}</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
