import { describe, expect, it, vi } from 'vitest'
import { subscribeToForeground } from './app-state'

const boundary = vi.hoisted(() => ({
  listeners: new Set<(state: string) => void>(),
}))

vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_event: string, listener: (state: string) => void) => {
      boundary.listeners.add(listener)
      return { remove: () => boundary.listeners.delete(listener) }
    },
  },
}))

describe('foreground session check boundary', () => {
  it('checks only active transitions and removes the native subscription on cleanup', () => {
    const checks: string[] = []
    const unsubscribe = subscribeToForeground(() => checks.push('checked'))
    for (const listener of boundary.listeners) listener('background')
    expect(checks).toEqual([])
    for (const listener of boundary.listeners) listener('active')
    expect(checks).toEqual(['checked'])
    unsubscribe()
    for (const listener of boundary.listeners) listener('active')
    expect(checks).toEqual(['checked'])
  })
})
