/** Conservative application integer budget, not Excel's maximum numeric magnitude. */
export const MAX_EXCEL_INTEGER = 999_999_999_999_999
export function safeSpreadsheetText(value) {
  if (typeof value !== 'string') throw new Error('spreadsheet text must be a string')
  const text = value.trim()
  if (
    !text ||
    text.length > 160 ||
    Array.from(text).some((char) => {
      const point = char.codePointAt(0)
      return point < 32 || point === 127
    })
  )
    throw new Error('invalid spreadsheet text')
  return /^[=+\-@]/u.test(text) ? `'${text}` : text
}
export function normalizeRowId(value) {
  if (typeof value !== 'string') throw new Error('invalid row id')
  const id = value.normalize('NFC').trim()
  // Identity must not collide after formula-text prefixing or contain arbitrary control syntax.
  if (!/^[\p{L}\p{N}][\p{L}\p{N}_.:-]{0,63}$/u.test(id)) throw new Error('invalid row id')
  return id
}
export function checkRows(rows) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 500)
    throw new Error('expected 1–500 rows')
  const ids = new Set(),
    totals = { reads: 0, stars: 0 }
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('invalid row id')
    const id = normalizeRowId(row.id).toLocaleLowerCase('en-US')
    if (ids.has(id)) throw new Error('duplicate row id')
    ids.add(id)
    safeSpreadsheetText(row.source)
    for (const field of ['reads', 'stars']) {
      if (!Number.isSafeInteger(row[field]) || row[field] < 0) throw new Error(`invalid ${field}`)
      totals[field] += row[field]
      if (!Number.isSafeInteger(totals[field]) || totals[field] > MAX_EXCEL_INTEGER)
        throw new Error(`unsafe aggregate ${field}`)
    }
  }
  return totals
}
