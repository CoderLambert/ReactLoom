export const MAX_ROWS = 200;
export const HEADERS = Object.freeze(['channel', 'views', 'kind']);

function safeLabel(value, field) {
  if (typeof value !== 'string') throw new TypeError(`${field}必须是文本`);
  const label = value.trim();
  if (!label || label.length > 120 || /[\u0000-\u001f\u007f]/u.test(label)) {
    throw new Error(`${field}为空、过长或含控制字符`);
  }
  // A leading formula operator must remain literal when exported to XLSX/CSV.
  return /^[=+\-@]/u.test(label) ? `'${label}` : label;
}

export function normalize(rows) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > MAX_ROWS) {
    throw new Error('超出允许的行数');
  }
  const names = new Set();
  return rows.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('每行必须是对象');
    if (Object.keys(row).sort().join('|') !== [...HEADERS].sort().join('|')) {
      throw new Error('列必须严格为 channel、views、kind');
    }
    const channel = safeLabel(row.channel, '频道');
    const identity = channel.toLocaleLowerCase('en-US');
    if (names.has(identity)) throw new Error('重复的订阅频道');
    names.add(identity);
    if (!Number.isSafeInteger(row.views) || row.views < 0) {
      throw new Error('计数必须是非负安全整数');
    }
    return {channel, views: row.views, kind: safeLabel(row.kind, '类别')};
  });
}
