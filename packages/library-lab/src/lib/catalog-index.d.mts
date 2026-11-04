import type { CatalogEntry, Entry } from './types'
export function toCatalogIndex(entries: Entry[]): CatalogEntry[]
export function validateCatalogIndex(value: unknown): CatalogEntry[]
export function validateCatalogDetail(value: unknown, summary: CatalogEntry): Entry
export function filterCatalogIndex(
  entries: CatalogEntry[],
  query?: string,
  group?: string,
  onlyDemos?: boolean,
): CatalogEntry[]
