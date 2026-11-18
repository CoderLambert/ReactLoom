import assert from 'node:assert/strict'
import test from 'node:test'
import { PAGE_SIZE, SITES, sample, tablePage } from '../examples/deck-data.ts'

test('dense fixture keeps unique finite coordinates and the exact health count', () => {
  const rows = [...SITES, ...sample(1200)]
  assert.equal(rows.length, 1204)
  assert.equal(new Set(rows.map((row) => row.id)).size, 1204)
  assert.equal(rows.filter((row) => row.healthy).length, 903)
  assert.ok(
    rows.every(
      (row) =>
        Number.isFinite(row.position[0] + row.position[1]) &&
        row.position[0] >= -180 &&
        row.position[0] <= 180 &&
        Math.abs(row.position[1]) < 85,
    ),
  )
  assert.equal(sample(Infinity).length, 0)
})
test('paging reaches every row exactly once and clamps after shrinking', () => {
  const rows = [...SITES, ...sample(1200)]
  const pages = Math.ceil(rows.length / PAGE_SIZE)
  const ids = Array.from({ length: pages }, (_, page) => tablePage(rows, page).rows)
    .flat()
    .map((row) => row.id)
  assert.deepEqual(
    ids,
    rows.map((row) => row.id),
  )
  assert.equal(tablePage(SITES, pages - 1).page, 0)
  assert.deepEqual(tablePage([], 99), { page: 0, pages: 1, rows: [] })
})
