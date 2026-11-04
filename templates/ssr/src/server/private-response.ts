import { NextResponse } from 'next/server'

// Authentication and user-scoped JSON must not be stored by HTTP caches.
export function privateJson<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
