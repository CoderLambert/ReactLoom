'use client'

export default function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="space-y-4 py-16">
      <h1 className="text-4xl">This view hit a snag.</h1>
      <p className="text-muted">{error.message}</p>
      <button
        type="button"
        className="rounded-full bg-ink px-4 py-2 text-sm text-linen"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  )
}
