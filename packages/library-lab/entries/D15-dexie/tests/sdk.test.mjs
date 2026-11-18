import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import test from 'node:test'
import Dexie from 'dexie'
import {
  createFeedDatabase,
  feedSchemaV2,
  feedSeed,
  findGroupByTime,
  findGroupTimeRange,
  writeDuplicateBatch,
} from '../examples/feed-database.mjs'
import { sameFeedSnapshot } from '../examples/rollback-policy.mjs'

async function withDatabase(label, run) {
  const name = `reactloom-lab-d15-test-${label}-${crypto.randomUUID()}`
  const connections = []
  const connect = (version = 1) => {
    const db = createFeedDatabase(name, version)
    connections.push(db)
    return db
  }
  try {
    await run(connect)
  } finally {
    for (const db of connections) db.close()
    await Dexie.delete(name)
  }
}

test('real Dexie filters by group and sorts matches independently of primary-key order', async () => {
  await withDatabase('query', async (connect) => {
    const db = connect()
    // sortBy does not require an index on its sorting property.
    db.version(1).stores({ feeds: '&id,group' })
    const table = db.table('feeds')
    await table.bulkPut(feedSeed)
    assert.deepEqual(
      (await table.toArray()).map((row) => row.id),
      ['rss-a', 'rss-b', 'rss-c'],
    )
    const technology = await findGroupByTime(table, '技术')
    assert.deepEqual(
      technology.map((row) => row.id),
      ['rss-b', 'rss-a'],
    )
    assert.deepEqual(
      technology.map((row) => row.updatedAt),
      [100, 200],
    )
    assert.deepEqual(
      (await findGroupByTime(table, '商业')).map((row) => row.id),
      ['rss-c'],
    )
    assert.deepEqual(await findGroupByTime(table, '不存在'), [])
  })
})

test('duplicate add rejects the whole real Dexie transaction and preserves every business field', async () => {
  await withDatabase('rollback', async (connect) => {
    const db = connect()
    const table = db.table('feeds')
    await table.bulkPut(feedSeed)
    const before = await table.toArray()
    await assert.rejects(writeDuplicateBatch(db), { name: 'ConstraintError' })
    const after = await table.toArray()
    assert.equal(sameFeedSnapshot(before, after), true)
    assert.deepEqual(after, before)
    assert.equal(await table.get('rss-d'), undefined, 'earlier successful put must roll back')
    assert.deepEqual(
      await table.get('rss-a'),
      feedSeed[0],
      'duplicate add must not replace the original',
    )
  })
})

test('handling a duplicate error inside the transaction lets earlier writes commit', async () => {
  await withDatabase('caught-error', async (connect) => {
    const db = connect()
    const table = db.table('feeds')
    await table.bulkPut(feedSeed)
    await db.transaction('rw', table, async () => {
      await table.add({ id: 'rss-d', group: '技术', updatedAt: 400, read: false })
      await table.add(feedSeed[0]).catch('ConstraintError', () => {})
    })
    assert.equal(await table.count(), 4)
    assert.equal((await table.get('rss-d')).updatedAt, 400)
  })
})

test('v1 upgrades without its old schema declaration, preserves read=true and installs the compound index', async () => {
  await withDatabase('upgrade', async (connect) => {
    const legacy = connect()
    await legacy
      .table('feeds')
      .bulkPut([
        ...feedSeed,
        { id: 'rss-legacy', group: '技术', updatedAt: 250 },
        { id: 'rss-too-late', group: '技术', updatedAt: 400, read: false },
      ])
    legacy.close()
    // The shared v2 factory declares only version(2), including its data upgrader.
    const modern = connect(2)
    let upgradeCalls = 0
    modern.version(2).upgrade(() => {
      upgradeCalls++
    })
    await modern.open()
    assert.equal(modern.verno, 2)
    assert.equal(upgradeCalls, 1)
    assert.equal((await modern.table('feeds').get('rss-legacy')).read, false)
    assert.equal((await modern.table('feeds').get('rss-b')).read, true)
    assert.equal(await modern.table('feeds').count(), 5, 'upgrade must preserve all existing rows')
    const items = await findGroupTimeRange(modern.table('feeds'), '技术', 100, 250)
    assert.deepEqual(
      items.map((row) => row.id),
      ['rss-b', 'rss-a', 'rss-legacy'],
    )
    assert.deepEqual(
      items.map((row) => row.updatedAt),
      [100, 200, 250],
    )
    assert.deepEqual(
      (await findGroupTimeRange(modern.table('feeds'), '技术', 150, 250)).map((row) => row.id),
      ['rss-a', 'rss-legacy'],
    )
    modern.close()
    const reopened = connect(2)
    reopened.version(2).upgrade(() => {
      upgradeCalls++
    })
    await reopened.open()
    assert.equal(upgradeCalls, 1, 'already upgraded database must not replay the upgrader')
  })
})

test('a fresh v2 database creates the latest schema without invoking data upgraders', async () => {
  await withDatabase('fresh-v2', async (connect) => {
    const db = connect(2)
    let upgradeCalls = 0
    db.version(2).upgrade(() => {
      upgradeCalls++
    })
    await db.open()
    await db.table('feeds').add({ id: 'fresh', group: '技术', updatedAt: 100 })
    assert.equal(db.verno, 2)
    assert.equal(upgradeCalls, 0, 'new database creation is not a v1 → v2 migration')
    const items = await findGroupTimeRange(db.table('feeds'), '技术', 100, 100)
    assert.equal(items.length, 1, 'latest compound index must exist on fresh creation')
    assert.equal(
      items[0].read,
      undefined,
      'upgrade is not a default-value validator for new writes',
    )
  })
})

test('a v1 client can jump to v3 when the required v2 data upgrader is retained', async () => {
  await withDatabase('v3', async (connect) => {
    const legacy = connect()
    await legacy.table('feeds').add({ id: 'legacy', group: '技术', updatedAt: 100 })
    legacy.close()
    const latest = connect(2)
    latest.version(3).stores({ feeds: `${feedSchemaV2},readVersion` })
    await latest.open()
    assert.equal(latest.verno, 3)
    assert.equal((await latest.table('feeds').get('legacy')).read, false)
  })
})
