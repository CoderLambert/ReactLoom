import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'

const { run, state } = vi.hoisted(() => ({
  run: vi.fn(),
  state: vi.fn(async () => ({ running: false, error: null, report: null })),
}))

vi.mock('@reactloom/devtools/lighthouse-server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@reactloom/devtools/lighthouse-server')>()),
  createLighthouseServer: () => ({ run, state }),
}))

function request(method: 'GET' | 'POST', origin?: string) {
  const headers = new Headers({ host: 'localhost:4318' })
  if (origin !== undefined) headers.set('origin', origin)
  return new Request('http://localhost:4318/api/devtools/lighthouse', { method, headers })
}

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development')
  vi.stubEnv('NEXT_PUBLIC_DEVTOOLS', 'true')
  run.mockClear()
  state.mockClear()
})

afterEach(() => vi.unstubAllEnvs())

describe('local Lighthouse route', () => {
  it('rejects a POST without an Origin before starting Lighthouse', async () => {
    expect((await POST(request('POST'))).status).toBe(404)
    expect(run).not.toHaveBeenCalled()
  })

  it.each(['null', 'https://other.example', 'http://localhost:9999'])(
    'rejects a POST with a nonmatching Origin (%s)',
    async (origin) => {
      expect((await POST(request('POST', origin))).status).toBe(404)
      expect(run).not.toHaveBeenCalled()
    },
  )

  it('accepts a matching local POST and starts only the fixed audit', async () => {
    const response = await POST(request('POST', 'http://localhost:4318'))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ running: false, error: null, report: null })
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('keeps GET available to local requests without an Origin', async () => {
    expect((await GET(request('GET'))).status).toBe(200)
    expect(run).not.toHaveBeenCalled()
  })

  it('does not launch audits outside development or when devtools are disabled', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect((await POST(request('POST', 'http://localhost:4318'))).status).toBe(404)
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_DEVTOOLS', 'false')
    expect((await POST(request('POST', 'http://localhost:4318'))).status).toBe(404)
    expect(run).not.toHaveBeenCalled()
  })
})
