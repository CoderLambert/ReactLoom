import { parseAsInteger, parseAsString } from 'nuqs/server'
import type { Feed } from './url-policy.mjs'
export type QueryState = { query: string; page: number; group: string }
export type QueryUpdate = { query?: string | null; page?: number | null; group?: string | null }
export const URL_KEYS: Readonly<{ query: 'll_c19_q'; page: 'll_c19_page'; group: 'll_c19_group' }>
export const queryParsers: {
  query: ReturnType<typeof parseAsString.withDefault>
  page: ReturnType<typeof parseAsInteger.withDefault>
  group: ReturnType<typeof parseAsString.withDefault>
}
export function loadQuery(input: string | URL | URLSearchParams): QueryState
export function serializeQuery(base: string | URL | URLSearchParams, update: QueryUpdate): string
export const feeds: Feed[]
export function pageLink(pathname: string, search: string, hash: string, value: string): string
