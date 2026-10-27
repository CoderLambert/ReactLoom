/** Pure import policy. Parsing and CSV quoting remain Papa Parse's responsibility. */
export const FEED_HEADERS = Object.freeze(['title', 'url', 'note']);

export function validateHeaders(fields, renamedHeaders = {}) {
  if (!Array.isArray(fields) || fields.length !== FEED_HEADERS.length ||
      fields.some((field, i) => field !== FEED_HEADERS[i]) ||
      Object.keys(renamedHeaders ?? {}).length > 0) {
    throw new Error('CSV 表头必须严格为 title,url,note，不能重复、增列或改序');
  }
}

function readText(value, field, maxLength, {allowNewline = false} = {}) {
  if (typeof value !== 'string') throw new Error(field + ' 必须是文本');
  const valueText = value.trim();
  if (valueText.length > maxLength) throw new Error(field + ' 超过 ' + maxLength + ' 字符');
  const invalidControls = allowNewline ? /[\u0000-\u0009\u000B-\u001F\u007F]/u : /[\u0000-\u001F\u007F]/u;
  if (invalidControls.test(valueText)) throw new Error(field + ' 含控制字符');
  return valueText;
}

export function normalizeFeed(raw, seen) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
      Object.keys(raw).some(key => !FEED_HEADERS.includes(key))) {
    throw new Error('数据列与声明表头不一致');
  }
  const title = readText(raw.title, 'title', 160);
  const rawUrl = readText(raw.url, 'url', 2048);
  const note = readText(raw.note ?? '', 'note', 2000, {allowNewline: true});
  if (!title || !rawUrl) throw new Error('缺少名称或 URL');
  let normalized;
  try { normalized = new URL(rawUrl); }
  catch { throw new Error('URL 语法无效'); }
  if (normalized.protocol !== 'https:' || normalized.username || normalized.password) {
    throw new Error('URL 必须是无凭据的 HTTPS 地址');
  }
  normalized.hash = '';
  if (seen.has(normalized.href)) throw new Error('重复 URL');
  seen.add(normalized.href);
  return {title, url: normalized.href, note};
}
