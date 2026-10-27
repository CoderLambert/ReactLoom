import Papa from 'papaparse';
import {FEED_HEADERS, validateHeaders, normalizeFeed} from './policy.mjs';

/** The same real-SDK parser is used by both the UI and Node integration tests. */
export function reportCSV(source) {
  if (typeof source !== 'string' || source.length > 256_000) throw new Error('CSV 超出文本处理上限');
  const result = Papa.parse(source.replace(/^\uFEFF/u, ''), {
    header: true, skipEmptyLines: 'greedy', dynamicTyping: false,
  });
  const accepted = [];
  const rejected = [];
  const seen = new Set();
  const parserErrors = result.errors.map(error => '行 ' + (error.row ?? '?') + ': ' + error.code + ' / ' + error.message);
  let headersValid = true;
  try { validateHeaders(result.meta.fields, result.meta.renamedHeaders); }
  catch (error) { headersValid = false; rejected.push(String(error.message ?? error)); }

  const fieldMismatch = new Set();
  const hasUnrecoverableError = result.errors.some(error => {
    if ((error.code === 'TooManyFields' || error.code === 'TooFewFields') &&
        Number.isSafeInteger(error.row) && error.row >= 0) {
      fieldMismatch.add(error.row);
      return false;
    }
    return true;
  });
  if (hasUnrecoverableError) rejected.push('存在不可恢复的 CSV 结构错误；整批拒绝');
  if (headersValid && !hasUnrecoverableError) {
    result.data.forEach((raw, index) => {
      if (fieldMismatch.has(index) || Object.hasOwn(raw, '__parsed_extra')) {
        rejected.push('第 ' + (index + 2) + ' 行：列数与表头不一致');
        return;
      }
      try { accepted.push(normalizeFeed(raw, seen)); }
      catch (error) { rejected.push('第 ' + (index + 2) + ' 行：' + String(error.message ?? error)); }
    });
  }
  return {
    accepted, rejected, total: result.data.length, parserErrors,
    escapedCsv: Papa.unparse(accepted, {columns: FEED_HEADERS, header: true, escapeFormulae: true}),
  };
}
