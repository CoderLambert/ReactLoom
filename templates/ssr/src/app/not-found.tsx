import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="space-y-4 py-16">
      <h1 className="text-4xl">That page is not on the loom.</h1>
      <Link href="/" className="text-sm font-semibold text-copper">
        Go home
      </Link>
    </section>
  )
}
