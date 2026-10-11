import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { diffProps, useWhyDidYouUpdate } from './use-why-did-you-update.js'

function Probe({ value, same }: { value: number; same: string }) {
  useWhyDidYouUpdate('Probe', { value, same })
  return null
}

describe('diffProps', () => {
  it('reports only the keys that changed', () => {
    expect(diffProps({ value: 1, same: 'a' }, { value: 2, same: 'a' })).toEqual({
      value: { previous: 1, next: 2 },
    })
  })

  it('reports a key that was added or removed', () => {
    expect(diffProps({ value: 1 }, { extra: true })).toEqual({
      value: { previous: 1, next: undefined },
      extra: { previous: undefined, next: true },
    })
  })
})

describe('useWhyDidYouUpdate', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('logs the props that changed between renders', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const view = render(<Probe value={1} same="a" />)
    view.rerender(<Probe value={2} same="a" />)
    expect(spy).toHaveBeenCalledWith('[why-did-you-update] Probe', {
      value: { previous: 1, next: 2 },
    })
  })

  it('does not log in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const view = render(<Probe value={1} same="a" />)
    view.rerender(<Probe value={2} same="a" />)
    expect(spy).not.toHaveBeenCalled()
  })
})
