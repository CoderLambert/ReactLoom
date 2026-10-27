export const GROUPS = Object.freeze({
  A: '图表 · 画布 · 地图', B: '组件 · 动画 · 交互', C: '表单 · 数据 · 日期',
  D: '请求 · 状态 · 工具', E: '编辑 · AI · 多媒体', F: '文件 · 测试 · 工程',
});
export const TABS = Object.freeze(['demo', 'docs', 'agent', 'related']);
export function normalizeTab(value) { return TABS.includes(value) ? value : 'demo'; }
export function safeRelativePath(value) {
  return typeof value === 'string' && value.length > 0 && !value.startsWith('/') &&
    !/[\\\u0000-\u001f:?#]/u.test(value) && value.split('/').every(p => p && p !== '.' && p !== '..');
}
export function safeLink(value) {
  if (typeof value !== 'string' || /[\u0000-\u0020\u007f\\]/u.test(value)) return '';
  if (value.startsWith('#')) return /^#[\p{L}\p{N}_.:-]+$/u.test(value) ? value : '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
export function filterEntries(entries, query = '', group = 'all', runnable = false) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  return entries.filter(entry => {
    if (group !== 'all' && entry.group !== group) return false;
    if (runnable && !entry.demos?.some(d => Boolean(d.entryPoint))) return false;
    const haystack = [entry.entryId,entry.name,entry.slug,entry.summary,...(entry.tags ?? []),...(entry.packages ?? []).map(p => p.name)].join(' ').toLocaleLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}
export function validateEntry(entry) {
  const errors = [];
  if (!entry || typeof entry !== 'object') return ['entry must be an object'];
  if (entry.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!/^[A-F]\d{2}$/.test(entry.entryId ?? '')) errors.push('invalid entryId');
  if (!(entry.group in GROUPS) || entry.entryId?.[0] !== entry.group) errors.push('group/id mismatch');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug ?? '')) errors.push('invalid slug');
  for (const key of ['name','summary']) if (typeof entry[key] !== 'string' || !entry[key].trim()) errors.push(`missing ${key}`);
  if (!['missing','imported','reviewed','recreated'].includes(entry.contentState)) errors.push('invalid contentState');
  for (const key of ['tags','packages','references','related','demos']) if (!Array.isArray(entry[key])) errors.push(`${key} must be array`);
  for (const ref of Array.isArray(entry.references) ? entry.references : []) if (!ref.title || !safeLink(ref.url).startsWith('https:')) errors.push('invalid reference');
  const seen = new Set();
  for (const d of Array.isArray(entry.demos) ? entry.demos : []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.demoId ?? '') || seen.has(d.demoId)) errors.push('invalid/duplicate demoId');
    seen.add(d.demoId);
    if (!['basic','business','advanced'].includes(d.level)) errors.push('invalid demo level');
    if (!['react','browser-frame','worker','node-ci'].includes(d.executionKind)) errors.push('invalid executionKind');
    if (d.entryPoint && !safeRelativePath(d.entryPoint)) errors.push('unsafe entryPoint');
    if (!Array.isArray(d.sourceFiles) || d.sourceFiles.some(f => !safeRelativePath(f))) errors.push('unsafe sourceFiles');
  }
  for (const r of Array.isArray(entry.related) ? entry.related : []) if (!/^[A-F]\d{2}$/.test(r.entryId ?? '') || !['alternative','complements','migration-to'].includes(r.relation) || !r.reason) errors.push('invalid relationship');
  return errors;
}
