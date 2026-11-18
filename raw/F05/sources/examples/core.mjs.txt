import * as XLSX from 'xlsx'
import { preflightXlsx } from './archive-policy.mjs'
import { HEADERS, MAX_ROWS, normalize } from './validation.mjs'

export { normalize } from './validation.mjs'

export const fixture = [
  { channel: 'Frontend', views: 128, kind: '订阅' },
  { channel: 'AI', views: 63, kind: '推荐' },
  { channel: 'DevOps', views: 32, kind: '专题' },
]

export function createSubscriptionSheet(rows) {
  const clean = normalize(rows)
  // A fresh header array avoids sharing an array that SheetJS may extend.
  const sheet = XLSX.utils.json_to_sheet(clean, { header: [...HEADERS] })
  sheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 16 }]
  return sheet
}

export function createWorkbook(rows = fixture) {
  const sheet = createSubscriptionSheet(rows)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Subscriptions')
  return book
}

export function writeWorkbook(book) {
  return XLSX.write(book, { bookType: 'xlsx', type: 'buffer', compression: true })
}

export function exportWorkbook(rows) {
  return writeWorkbook(createWorkbook(rows))
}

export function readWorkbookBytes(bytes) {
  // This checks declared ZIP metadata. It is not an isolated or memory-bounded parser.
  preflightXlsx(bytes)
  return XLSX.read(bytes, {
    type: 'buffer',
    cellFormula: true,
    cellHTML: false,
    cellText: false,
    sheetRows: MAX_ROWS + 2,
  })
}

export function readSubscriptionSheet(sheet) {
  const ref = sheet?.['!fullref'] || sheet?.['!ref']
  if (!ref) throw new Error('工作表为空')
  const range = XLSX.utils.decode_range(ref)
  if (range.s.r !== 0 || range.s.c !== 0 || range.e.c !== 2 || range.e.r > MAX_ROWS) {
    throw new Error('工作表必须从A1开始，仅有三列且不超过200行数据')
  }
  for (const [address, cell] of Object.entries(sheet)) {
    if (address.startsWith('!')) continue
    if (cell && typeof cell === 'object' && ('f' in cell || 'F' in cell)) {
      throw new Error('本导入器不接受公式单元格')
    }
  }
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
    // Keep internal blank rows so they fail the same schema as other invalid rows.
    blankrows: true,
  })
  const header = matrix.shift()
  if (!Array.isArray(header) || header.length !== 3 || header.some((v, i) => v !== HEADERS[i])) {
    throw new Error('工作表表头必须精确匹配 channel、views、kind')
  }
  return normalize(
    matrix.map((row) => {
      if (!Array.isArray(row) || row.length !== 3) throw new Error('每行必须恰好三列')
      return { channel: row[0], views: row[1], kind: row[2] }
    }),
  )
}

export function importWorkbook(bytes) {
  const book = readWorkbookBytes(bytes)
  if (book.SheetNames.length !== 1) throw new Error('仅接受单个工作表')
  return readSubscriptionSheet(book.Sheets[book.SheetNames[0]])
}
