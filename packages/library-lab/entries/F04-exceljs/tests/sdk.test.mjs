import assert from 'node:assert/strict'
import test from 'node:test'
import ExcelJS from 'exceljs'
import { FIXTURE, generateWorkbook, inspectWorkbook } from '../examples/core.mjs'
import { MAX_EXCEL_INTEGER } from '../examples/row-policy.mjs'

async function restore(bytes) {
  const book = new ExcelJS.Workbook()
  await book.xlsx.load(bytes)
  return book.getWorksheet('Sources')
}
test('real shared basic writer/load preserve frozen header style and normalized ID', async () => {
  const { bytes, totals } = await generateWorkbook('basic', [
    { id: ' news:01 ', source: 'Visible feed', reads: 12, stars: 3 },
  ])
  assert.ok(bytes.byteLength > 0)
  const sheet = await restore(bytes)
  assert.equal(sheet.getCell('A2').value, 'news:01')
  assert.equal(sheet.views[0].state, 'frozen')
  assert.equal(sheet.views[0].ySplit, 1)
  assert.equal(sheet.getRow(1).font.bold, true)
  assert.equal(sheet.getRow(1).fill.fgColor.argb, 'FF275B49')
  assert.equal(sheet.rowCount, 2)
  assert.deepEqual(totals, { reads: 12, stars: 3 })
})
test('real shared business roundtrip stores formula and caller-calculated cached result', async () => {
  const { bytes } = await generateWorkbook('business')
  const sheet = await restore(bytes),
    info = await inspectWorkbook(bytes)
  assert.deepEqual(info.summary, { formula: 'SUM(C2:C4)', result: 115 })
  assert.deepEqual(sheet.getCell('D5').value, { formula: 'SUM(D2:D4)', result: 17 })
  assert.equal(sheet.getCell('C5').type, ExcelJS.ValueType.Formula)
})
test('real formula-looking source stays prefixed string, never a formula object', async () => {
  const text = '=HYPERLINK("https://example.invalid","fixture")'
  const { bytes } = await generateWorkbook('advanced', [
    ...FIXTURE,
    { id: 'untrusted:1', source: text, reads: 0, stars: 0 },
  ])
  const sheet = await restore(bytes)
  assert.equal(sheet.getCell('B5').type, ExcelJS.ValueType.String)
  assert.equal(sheet.getCell('B5').value, `'${text}`)
  // ExcelJS does NOT automatically promote plain strings into formula objects.
  const plain = new ExcelJS.Workbook(),
    page = plain.addWorksheet('Plain')
  page.getCell('A1').value = '=2+3'
  const own = await plain.xlsx.writeBuffer()
  const decoded = new ExcelJS.Workbook()
  await decoded.xlsx.load(own)
  assert.equal(decoded.getWorksheet('Plain').getCell('A1').type, ExcelJS.ValueType.String)
})
test('invalid rows reject before output; largest budget roundtrips exactly', async () => {
  const row = { id: 'safe', source: 'Valid', reads: 1, stars: 1 }
  for (const invalid of [
    [{ ...row, reads: NaN }],
    [{ ...row, reads: Infinity }],
    [{ ...row, reads: MAX_EXCEL_INTEGER + 1 }],
    [row, { ...row, id: ' SAFE ' }],
    Array.from({ length: 501 }, (_, i) => ({ ...row, id: `r${i}` })),
  ])
    await assert.rejects(generateWorkbook('advanced', invalid))
  const { bytes } = await generateWorkbook('business', [
    { ...row, reads: MAX_EXCEL_INTEGER, stars: 0 },
  ])
  const sheet = await restore(bytes)
  assert.equal(sheet.getCell('C2').value, MAX_EXCEL_INTEGER)
  assert.equal(sheet.getCell('C3').value.result, MAX_EXCEL_INTEGER)
})
