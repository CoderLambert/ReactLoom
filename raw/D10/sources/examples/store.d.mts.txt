import type { StateStorage } from 'zustand/middleware'
import type { StoreApi } from 'zustand/vanilla'
export type Tenant = 'team-a' | 'team-b'
export type View = 'grid' | 'list'
export type ChannelState = {
  tenant: Tenant
  view: View
  enabledByTenant: Record<Tenant, boolean>
  setTenant: (tenant: Tenant) => void
  setView: (view: View) => void
  toggle: () => void
}
export const KEY: string
export function makeMemoryStorage(): {
  storage: StateStorage
  seed: (raw: string) => unknown
  inspect: () => string
  dispose: () => boolean
}
export function createChannelStore(storage: StateStorage): StoreApi<ChannelState> & {
  persist: { rehydrate: () => Promise<void> | void; hasHydrated: () => boolean }
}
