import assert from 'node:assert/strict'
import test from 'node:test'
import * as XLSX from 'xlsx'
import { createCategoryReport, reportFixture } from '../examples/category-report.mjs'
import {
  exportWorkbook,
  fixture,
  importWorkbook,
  readSubscriptionSheet,
  readWorkbookBytes,
  writeWorkbook,
} from '../examples/core.mjs'
import { invalidWorkbookCases } from '../examples/invalid-workbooks.mjs'

test('0.20.3 writes real XLSX bytes and restores typed cells and exact row values', () => {
  assert.equal(XLSX.version, '0.20.3')
  const bytes = exportWorkbook(fixture)
  assert.equal(bytes.subarray(0, 2).toString(), 'PK')
  assert.deepEqual(importWorkbook(bytes), fixture)
  assert.deepEqual(importWorkbook(new Uint8Array(bytes)), fixture)
  const book = readWorkbookBytes(bytes)
  assert.deepEqual(book.SheetNames, ['Subscriptions'])
  assert.equal(book.Sheets.Subscriptions['!ref'], 'A1:C4')
  assert.equal(book.Sheets.Subscriptions.B2.t, 'n')
  assert.equal(book.Sheets.Subscriptions.B2.v, 128)
})

test('category report restores summary values and every detail worksheet', () => {
  const { book, summary } = createCategoryReport(reportFixture)
  const restored = readWorkbookBytes(writeWorkbook(book))
  assert.deepEqual(restored.SheetNames, ['Summary', 'Category-1', 'Category-2', 'Category-3'])
  assert.deepEqual(XLSX.utils.sheet_to_json(restored.Sheets.Summary, { raw: true }), summary)
  assert.equal(
    summary.reduce((total, group) => total + group.totalViews, 0),
    250,
  )
  for (const group of summary) {
    assert.deepEqual(
      readSubscriptionSheet(restored.Sheets[group.sheet]),
      reportFixture.filter((row) => row.kind === group.kind),
    )
  }
  assert.throws(() => importWorkbook(writeWorkbook(book)), /单个工作表/)
})

test('category totals reject integer overflow before serializing a false number', () => {
  assert.throws(
    () =>
      createCategoryReport([
        { channel: 'A', views: Number.MAX_SAFE_INTEGER, kind: 'RSS' },
        { channel: 'B', views: 1, kind: 'RSS' },
      ]),
    /安全整数/,
  )
})

test('formula-like labels stay string cells after an actual byte round trip', () => {
  const rows = ['=', '+', '-', '@'].map((prefix) => ({
    channel: `${prefix}literal`,
    views: 1,
    kind: 'RSS',
  }))
  const book = readWorkbookBytes(exportWorkbook(rows))
  for (let index = 0; index < rows.length; index++) {
    const cell = book.Sheets.Subscriptions[`A${index + 2}`]
    assert.equal(cell.t, 's')
    assert.equal(cell.v, `'${rows[index].channel}`)
    assert.equal(cell.f, undefined)
  }
})

test('maximum normalized labels round trip; escaping overflow is rejected before workbook creation', () => {
  for (const field of ['channel', 'kind']) {
    for (const prefix of ['=', '+', '-', '@']) {
      const rows = [{ channel: 'A', views: 1, kind: 'RSS', [field]: prefix + 'a'.repeat(118) }]
      const restored = importWorkbook(exportWorkbook(rows))
      assert.equal(restored[0][field], `'${rows[0][field]}`)
      assert.equal(restored[0][field].length, 120)
      const report = createCategoryReport(rows)
      const detail = readWorkbookBytes(writeWorkbook(report.book)).Sheets['Category-1']
      assert.equal(readSubscriptionSheet(detail)[0][field], restored[0][field])
      const overflow = [{ ...rows[0], [field]: prefix + 'a'.repeat(119) }]
      assert.throws(() => exportWorkbook(overflow), /过长/)
      assert.throws(() => createCategoryReport(overflow), /过长/)
    }
  }
})

for (const scenario of invalidWorkbookCases()) {
  test(`real XLSX input rejects ${scenario.name}`, () => {
    assert.throws(() => importWorkbook(scenario.bytes), scenario.error)
  })
}
