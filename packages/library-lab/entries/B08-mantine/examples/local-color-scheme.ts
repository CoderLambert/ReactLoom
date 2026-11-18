import type { MantineColorScheme, MantineColorSchemeManager } from '@mantine/core'

/** Public manager extension backed by this instance's memory, not host localStorage. */
export function createLocalColorSchemeManager(): MantineColorSchemeManager {
  let value: MantineColorScheme = 'light'
  return {
    get: () => value,
    set: (next) => {
      value = next
    },
    clear: () => {
      value = 'light'
    },
    // There is no external storage/event source to subscribe to.
    subscribe: () => {},
    unsubscribe: () => {},
  }
}
