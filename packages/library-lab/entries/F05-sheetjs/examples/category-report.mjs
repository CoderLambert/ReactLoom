import * as XLSX from 'xlsx'
import { createSubscriptionSheet, normalize } from './core.mjs'

export const reportFixture = [
  { channel: 'Frontend', views: 128, kind: 'RSS' },
  { channel: 'AI', views: 63, kind: '推荐' },
  { channel: 'DevOps', views: 32, kind: 'RSS' },
  { channel: 'Design', views: 27, kind: '专题' },
]

function sumViews(records) {
  let total = 0
  for (const row of records) {
    total += row.views
    if (!Number.isSafeInteger(total)) throw new Error('类别汇总超出安全整数范围')
  }
  return total
}

/** Business grouping and totals are JavaScript logic; SheetJS serializes their values. */
export function createCategoryReport(rows) {
  const clean = normalize(rows)
  const groups = new Map()
  for (const row of clean) {
    if (!groups.has(row.kind)) groups.set(row.kind, [])
    groups.get(row.kind).push(row)
  }
  const summary = [...groups].map(([kind, records], index) => ({
    kind,
    sheet: `Category-${index + 1}`,
    count: records.length,
    totalViews: sumViews(records),
  }))
  const book = XLSX.utils.book_new()
  const summarySheet = XLSX.utils.json_to_sheet(summary, {
    header: ['kind', 'sheet', 'count', 'totalViews'],
  })
  XLSX.utils.book_append_sheet(book, summarySheet, 'Summary')
  for (const group of summary) {
    // Stable generated names avoid worksheet name restrictions on arbitrary category text.
    XLSX.utils.book_append_sheet(book, createSubscriptionSheet(groups.get(group.kind)), group.sheet)
  }
  return { book, summary }
}
