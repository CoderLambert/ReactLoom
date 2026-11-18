import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import { saveArtifacts } from './artifacts.mjs'
import { exportWorkbook, importWorkbook, readWorkbookBytes } from './core.mjs'
import { invalidWorkbookCases } from './invalid-workbooks.mjs'

const input = ['=', '+', '-', '@'].map((prefix, index) => ({
  channel: `${prefix}literal-${index}`,
  views: index,
  kind: '边界样例',
}))
const bytes = exportWorkbook(input)
const rows = importWorkbook(bytes)
const sheet = readWorkbookBytes(bytes).Sheets.Subscriptions
for (let index = 0; index < input.length; index++) {
  const cell = sheet[`A${index + 2}`]
  assert.equal(cell.t, 's')
  assert.equal(cell.f, undefined)
  assert.equal(cell.v, `'${input[index].channel}`)
}
const rejected = []
for (const scenario of invalidWorkbookCases()) {
  let reason = ''
  assert.throws(
    () => importWorkbook(scenario.bytes),
    (error) => {
      reason = error.message
      return scenario.error.test(reason)
    },
  )
  rejected.push({ name: scenario.name, reason })
}
await saveArtifacts('advanced', bytes, {
  scenario: 'advanced',
  sdkVersion: XLSX.version,
  literalCell: sheet.A2,
  rows,
  rejected,
  boundary: '真实 SheetJS 字节往返；不证明 Excel/LibreOffice 展示或解析器资源安全',
})
