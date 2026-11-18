import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import { saveArtifacts } from './artifacts.mjs'
import { createCategoryReport, reportFixture } from './category-report.mjs'
import { normalize, readSubscriptionSheet, readWorkbookBytes, writeWorkbook } from './core.mjs'

const { book, summary } = createCategoryReport(reportFixture)
const bytes = writeWorkbook(book)
// Read only our freshly generated report. The public single-sheet importer rejects this layout.
const restored = readWorkbookBytes(bytes)
const restoredSummary = XLSX.utils.sheet_to_json(restored.Sheets.Summary, { raw: true })
assert.deepEqual(restoredSummary, summary)
const categories = summary.map((group) => {
  const rows = readSubscriptionSheet(restored.Sheets[group.sheet])
  assert.deepEqual(rows, normalize(reportFixture.filter((row) => row.kind === group.kind)))
  assert.equal(rows.length, group.count)
  assert.equal(
    rows.reduce((total, row) => total + row.views, 0),
    group.totalViews,
  )
  return { sheet: group.sheet, rows }
})
assert.deepEqual(restored.SheetNames, ['Summary', ...summary.map((group) => group.sheet)])

await saveArtifacts('business', bytes, {
  scenario: 'business',
  sdkVersion: XLSX.version,
  sheetNames: restored.SheetNames,
  summary: restoredSummary,
  totalViews: summary.reduce((total, group) => total + group.totalViews, 0),
  categories,
})
