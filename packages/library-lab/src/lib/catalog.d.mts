import type { Entry, Group, Tab } from './types'
export const GROUPS: Readonly<Record<Group, string>>
export const TABS: readonly Tab[]
export function normalizeTab(value: unknown): Tab
export function safeRelativePath(value: unknown): boolean
export function safeLink(value: unknown): string
export function filterEntries(
  entries: Entry[],
  query?: string,
  group?: string,
  runnable?: boolean,
): Entry[]
export function validateEntry(entry: unknown): string[]
