import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import { saveArtifacts } from './artifacts.mjs'
import {
  createWorkbook,
  fixture,
  importWorkbook,
  readWorkbookBytes,
  writeWorkbook,
} from './core.mjs'

const book = createWorkbook(fixture)
const sheet = book.Sheets.Subscriptions
const bytes = writeWorkbook(book)
const restoredBook = readWorkbookBytes(bytes)
const rows = importWorkbook(bytes)
assert.deepEqual(rows, fixture)
assert.deepEqual(restoredBook.SheetNames, ['Subscriptions'])
assert.equal(restoredBook.Sheets.Subscriptions.B2.t, 'n')

await saveArtifacts('basic', bytes, {
  scenario: 'basic',
  sdkVersion: XLSX.version,
  flow: ['rows', 'worksheet', 'workbook', 'xlsx bytes', 'readback rows'],
  sheetNames: restoredBook.SheetNames,
  range: sheet['!ref'],
  cells: { A2: restoredBook.Sheets.Subscriptions.A2, B2: restoredBook.Sheets.Subscriptions.B2 },
  rows,
})
