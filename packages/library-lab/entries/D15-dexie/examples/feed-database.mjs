import Dexie from 'dexie'

export const feedSchemaV1 = '&id,group,updatedAt'
export const feedSchemaV2 = '&id,group,updatedAt,[group+updatedAt]'

// Different from primary-key order: sorting must change the result.
export const feedSeed = [
  { id: 'rss-a', group: '技术', updatedAt: 200, read: false },
  { id: 'rss-b', group: '技术', updatedAt: 100, read: true },
  { id: 'rss-c', group: '商业', updatedAt: 300, read: false },
]

export function createFeedDatabase(name, version = 1) {
  const db = new Dexie(name)
  if (version === 1) {
    db.version(1).stores({ feeds: feedSchemaV1 })
  } else {
    // Dexie >=3 reads the installed schema. v1 has no upgrader, so it may be omitted.
    db.version(2)
      .stores({ feeds: feedSchemaV2 })
      .upgrade((tx) =>
        tx
          .table('feeds')
          .toCollection()
          .modify((feed) => {
            if (feed.read === undefined) feed.read = false
          }),
      )
  }
  return db
}

export function findGroupByTime(table, group) {
  // `group` uses an index; sortBy sorts the resulting array in memory.
  return table.where('group').equals(group).sortBy('updatedAt')
}

export function findGroupTimeRange(table, group, from, to) {
  return table.where('[group+updatedAt]').between([group, from], [group, to], true, true).toArray()
}

export function writeDuplicateBatch(db) {
  const table = db.table('feeds')
  return db.transaction('rw', table, async () => {
    await table.put({ id: 'rss-d', group: '技术', updatedAt: 400, read: false })
    // Let the rejection leave this scope so both writes are rolled back.
    await table.add({ id: 'rss-a', group: '技术', updatedAt: 500, read: true })
  })
}
