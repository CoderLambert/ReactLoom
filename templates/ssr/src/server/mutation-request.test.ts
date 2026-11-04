import { describe, expect, it } from 'vitest'
import { mutationRequestError } from './mutation-request'

const origin = 'https://app.reactloom.test'

function requestWith(headers: HeadersInit) {
  return new Request(`${origin}/api/tasks`, { method: 'POST', headers })
}

const untrusted: HeadersInit[] = [
  { origin: 'https://evil.test' },
  { origin: 'https://sibling.reactloom.test' },
  { origin: 'http://app.reactloom.test' },
  { origin: 'https://app.reactloom.test:444' },
  { origin: 'null' },
  { origin: 'invalid' },
  { origin: `${origin}/path` },
  { origin: 'https://attacker@app.reactloom.test' },
  { origin: `${origin} https://evil.test` },
  {
    origin: 'https://evil.test',
    host: 'app.reactloom.test',
    'x-forwarded-host': 'evil.test',
  },
  { 'sec-fetch-site': 'cross-site' },
  { 'sec-fetch-site': 'same-site' },
  { origin, 'sec-fetch-site': 'cross-site' },
]

describe('mutation origin policy', () => {
  it.each(untrusted)('rejects untrusted provenance: %j', (headers) => {
    expect(mutationRequestError(requestWith(headers))?.status).toBe(403)
  })

  const trusted: HeadersInit[] = [
    { origin },
    {},
    { 'sec-fetch-site': 'none' },
    { 'sec-fetch-site': 'same-origin' },
    { origin, 'sec-fetch-site': 'same-site' },
  ]
  it.each(trusted)('allows exact origins and trusted non-browser clients: %j', (headers) => {
    expect(mutationRequestError(requestWith(headers))).toBeNull()
  })

  it.each([
    {
      url: 'http://0.0.0.0:4318/api/session',
      host: '127.0.0.1:4318',
      origin: 'http://127.0.0.1:4318',
    },
    { url: 'https://0.0.0.0:3000/api/session', host: 'app.reactloom.test:443', origin },
  ])('uses the public Host when Next exposes its bind address: %j', ({ url, host, origin }) => {
    const request = new Request(url, { method: 'POST', headers: { host, origin } })
    expect(mutationRequestError(request)).toBeNull()
  })

  it.each([
    '',
    'app.reactloom.test/path',
    'user@app.reactloom.test',
    'app.reactloom.test,evil.test',
  ])('rejects a malformed target Host: %j', (host) => {
    expect(mutationRequestError(requestWith({ host, origin }))?.status).toBe(403)
  })
})

describe('mutation JSON media type policy', () => {
  it.each(['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', ''])(
    'rejects a non-JSON body type: %j',
    (contentType) => {
      const request = requestWith({ origin, 'content-type': contentType })
      expect(mutationRequestError(request, true)?.status).toBe(415)
    },
  )

  it('accepts JSON with media type case and charset parameters', () => {
    const request = requestWith({
      origin,
      'content-type': 'Application/JSON; charset=utf-8',
    })
    expect(mutationRequestError(request, true)).toBeNull()
  })
})
