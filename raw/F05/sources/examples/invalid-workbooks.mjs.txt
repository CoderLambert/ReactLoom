import * as XLSX from 'xlsx'
import { writeWorkbook } from './core.mjs'
import { MAX_ROWS } from './validation.mjs'

const header = ['channel', 'views', 'kind']
const record = ['Frontend', 128, 'RSS']

export function matrixWorkbook(matrix) {
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(matrix), 'Subscriptions')
  return book
}

export function invalidWorkbookCases() {
  const formula = matrixWorkbook([header, record])
  formula.Sheets.Subscriptions.A2 = { t: 'n', f: '2+2', v: 4 }
  const multiple = matrixWorkbook([header, record])
  XLSX.utils.book_append_sheet(multiple, XLSX.utils.aoa_to_sheet([header, record]), 'Unexpected')
  return [
    {
      name: 'missing-column',
      book: matrixWorkbook([header.slice(0, 2), record.slice(0, 2)]),
      error: /三列/,
    },
    {
      name: 'extra-column',
      book: matrixWorkbook([
        [...header, 'extra'],
        [...record, 'ignored'],
      ]),
      error: /三列/,
    },
    {
      name: 'wrong-header',
      book: matrixWorkbook([['name', 'views', 'kind'], record]),
      error: /表头/,
    },
    {
      name: 'duplicate-channel',
      book: matrixWorkbook([header, record, ['frontend', 1, 'RSS']]),
      error: /重复/,
    },
    { name: 'negative-count', book: matrixWorkbook([header, ['A', -1, 'RSS']]), error: /非负/ },
    {
      name: 'blank-row',
      book: matrixWorkbook([header, record, [], ['B', 2, 'RSS']]),
      error: /文本/,
    },
    {
      name: 'too-many-rows',
      book: matrixWorkbook([
        header,
        ...Array.from({ length: MAX_ROWS + 1 }, (_, i) => [`Channel ${i}`, i, 'RSS']),
      ]),
      error: /200行/,
    },
    { name: 'formula-cell', book: formula, error: /公式/ },
    { name: 'multiple-sheets', book: multiple, error: /单个工作表/ },
  ].map(({ book, ...scenario }) => ({ ...scenario, bytes: writeWorkbook(book) }))
}
