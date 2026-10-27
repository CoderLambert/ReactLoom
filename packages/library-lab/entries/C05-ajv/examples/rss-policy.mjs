/**
 * Domain checks complement Ajv's trusted, structural JSON Schema. Ajv
 * uniqueItems only compares whole objects and cannot enforce RSS URL identity.
 * This is not an SSRF allowlist; servers must check DNS, IP and redirects.
 */
export function canonicalHttpsFeedUrl(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value || /[\u0000-\u001f\u007f]/u.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}

/** @returns {{path:string,message:string}[]} */
export function validateFeedBoundaries(level, payload) {
  if (level === 'advanced') return [];
  if (!payload || typeof payload !== 'object') return [{path:'/',message:'期望 RSS 数据对象'}];
  const rows = level === 'basic' ? [payload] : payload.feeds;
  if (!Array.isArray(rows)) return [{path:'/feeds',message:'期望 RSS 来源数组'}];
  const seen = new Set();
  const issues = [];
  rows.forEach((row, index) => {
    const path = level === 'basic' ? '/url' : '/feeds/' + index + '/url';
    const key = canonicalHttpsFeedUrl(row?.url);
    if (key === null) issues.push({path, message:'RSS URL 必须是无凭据的 HTTPS 完整地址'});
    else if (seen.has(key)) issues.push({path, message:'规范化后的 RSS URL 已存在'});
    else seen.add(key);
  });
  return issues;
}
