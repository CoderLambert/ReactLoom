import Link from 'next/link'

export default function HomePage() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-5">
        <p className="text-xs font-semibold tracking-[0.22em] text-copper uppercase">
          SSR template
        </p>
        <h1 className="max-w-xl text-5xl leading-tight">A server-rendered workshop.</h1>
        <p className="max-w-xl text-lg text-muted">
          Sessions live in an httpOnly cookie. Security headers are set on every response, and the
          sample feature still goes through the shared API client.
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-linen"
        >
          Enter the workshop
        </Link>
      </div>
      <aside className="rounded-3xl bg-card p-6 ring-1 ring-line">
        <h2 className="text-2xl">What this process owns</h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li>Signed session cookie, checked in proxy.ts before /tasks.</li>
          <li>Content-Security-Policy and the usual hardening headers.</li>
          <li>A standalone Docker image for self-hosting.</li>
        </ul>
      </aside>
    </section>
  )
}
