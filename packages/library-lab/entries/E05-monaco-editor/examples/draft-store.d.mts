export interface DraftSnapshot {
  version: 1
  language: 'typescript'
  code: string
  savedAt: string
}
export interface DraftStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
export declare const DRAFT_KEY: string
export declare function loadDraft(storage: DraftStorage): DraftSnapshot | null
export declare function saveDraft(
  storage: DraftStorage,
  code: string,
  savedAt?: string,
): DraftSnapshot
export declare function clearDraft(storage: DraftStorage): void
