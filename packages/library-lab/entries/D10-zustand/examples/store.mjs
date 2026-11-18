import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { migrateChannelPreferences } from './migration-policy.mjs'

export const KEY = 'reactloom:lab:zustand:channels:v2'
export function makeMemoryStorage() {
  const data = new Map()
  return {
    storage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value)
      },
      removeItem: (key) => {
        data.delete(key)
      },
    },
    seed: (raw) => data.set(KEY, raw),
    inspect: () => data.get(KEY) ?? '未写入',
    dispose: () => data.delete(KEY),
  }
}
export function createChannelStore(storage) {
  return createStore()(
    persist(
      (set) => ({
        tenant: 'team-a',
        view: 'list',
        enabledByTenant: { 'team-a': true, 'team-b': false },
        setTenant: (tenant) => set({ tenant }),
        setView: (view) => set({ view }),
        toggle: () =>
          set((state) => ({
            enabledByTenant: {
              ...state.enabledByTenant,
              [state.tenant]: !state.enabledByTenant[state.tenant],
            },
          })),
      }),
      {
        name: KEY,
        version: 2,
        storage: createJSONStorage(() => storage),
        skipHydration: true,
        partialize: (state) => ({ view: state.view, enabledByTenant: state.enabledByTenant }),
        migrate: migrateChannelPreferences,
        onRehydrateStorage: () => (_state, error) => {
          if (error) console.warn('偏好恢复失败，保留当前状态', error)
        },
      },
    ),
  )
}
