import type { i18n, Resource } from 'i18next'
export const resources: Resource
export function createLocalI18next(): Promise<i18n>
export function addLocalChannelResources(local: i18n): void
export function observeLocalI18next(
  local: i18n,
  handlers?: {
    onLanguage?: (language: string) => void
    onResource?: (language: string, namespace: string) => void
  },
): () => void
