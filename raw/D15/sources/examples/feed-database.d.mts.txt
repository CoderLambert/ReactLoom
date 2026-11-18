import type Dexie from 'dexie'
import type { Table } from 'dexie'
import type { FeedSnapshot } from './rollback-policy.mjs'

export const feedSchemaV1: string
export const feedSchemaV2: string
export const feedSeed: FeedSnapshot[]
export function createFeedDatabase(name: string, version?: 1 | 2): Dexie
export function findGroupByTime(
  table: Table<FeedSnapshot, string>,
  group: string,
): Promise<FeedSnapshot[]>
export function findGroupTimeRange(
  table: Table<FeedSnapshot, string>,
  group: string,
  from: number,
  to: number,
): Promise<FeedSnapshot[]>
export function writeDuplicateBatch(db: Dexie): Promise<void>
