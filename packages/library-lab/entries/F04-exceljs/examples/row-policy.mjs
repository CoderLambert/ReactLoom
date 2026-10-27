/** Pure input policy for the ExcelJS sample. Actual workbook IO stays in core.mjs. */
/** Excel has only 15 significant decimal digits, even though JS safe integers can be larger. */
export const MAX_EXCEL_INTEGER = 999_999_999_999_999;
export function safeSpreadsheetText(value) {
  if (typeof value !== 'string') throw new Error('spreadsheet text must be a string');
  const valueText = value.trim();
  if (!valueText || valueText.length > 160 || /[\u0000-\u001F\u007F]/u.test(valueText)) {
    throw new Error('invalid spreadsheet text');
  }
  return /^[=+\-@]/u.test(valueText) ? "'" + valueText : valueText;
}

export function checkRows(rows) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 500) {
    throw new Error('expected 1–500 rows');
  }
  const ids = new Set();
  const totals = {reads: 0, stars: 0};
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row) ||
        typeof row.id !== 'string' || !row.id.trim() || row.id.length > 64) {
      throw new Error('invalid row id');
    }
    const normalizedId = row.id.trim().toLocaleLowerCase('en-US');
    if (ids.has(normalizedId)) throw new Error('duplicate row id');
    ids.add(normalizedId);
    safeSpreadsheetText(row.id);
    safeSpreadsheetText(row.source);
    for (const field of ['reads','stars']) {
      if (!Number.isSafeInteger(row[field]) || row[field] < 0) {
        throw new Error('invalid ' + field);
      }
      totals[field] += row[field];
      if (!Number.isSafeInteger(totals[field]) || totals[field] > MAX_EXCEL_INTEGER) {
        throw new Error('unsafe aggregate ' + field);
      }
    }
  }
  return totals;
}
