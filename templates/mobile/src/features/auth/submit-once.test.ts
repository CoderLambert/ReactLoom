import { describe, expect, it } from 'vitest'
import { submitOnce } from './submit-once'

function deferred() {
  let release = () => {}
  const promise = new Promise<void>((resolve) => {
    release = () => resolve()
  })
  return { promise, release: () => release() }
}

describe('mobile login submission lock', () => {
  it('sends one request when valid submit handlers overlap', async () => {
    const pending = { current: false }
    const finish = deferred()
    let calls = 0
    const first = submitOnce(pending, async () => {
      calls += 1
      await finish.promise
    })
    expect(pending.current).toBe(true)
    const ignored = await submitOnce(pending, async () => {
      calls += 1
    })
    expect(ignored).toBe(false)
    expect(calls).toBe(1)
    finish.release()
    expect(await first).toBe(true)
    expect(pending.current).toBe(false)
    const retried = await submitOnce(pending, async () => {
      calls += 1
    })
    expect(retried).toBe(true)
    expect(calls).toBe(2)
  })

  it('releases the lock when the sign-in request rejects', async () => {
    const pending = { current: false }
    await expect(
      submitOnce(pending, async () => {
        throw new Error('Network unavailable')
      }),
    ).rejects.toThrow('Network unavailable')
    expect(pending.current).toBe(false)
    expect(await submitOnce(pending, async () => {})).toBe(true)
  })

  it('does not block a separate login form instance', async () => {
    const pendingA = { current: false }
    const pendingB = { current: false }
    const finish = deferred()
    const first = submitOnce(pendingA, async () => finish.promise)
    expect(await submitOnce(pendingB, async () => {})).toBe(true)
    finish.release()
    await first
  })
})
