/** Validate the generated catalogue at the fetch boundary. This is not an SDK test. */
import {validateEntry} from './catalog.mjs';
const HASH = /^[a-f0-9]{64}$/u;
const STATES = new Set(['PASS', 'FAIL', 'NOT_RUN', 'BLOCKED']);
const KINDS = ['sdk', 'build', 'browser'];
export function validateCatalogPayload(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 300)
    throw new Error('工具库目录必须是一个非空、受限的条目数组');
  const ids = new Set();
  const slugs = new Set();
  for (const entry of value) {
    const issues = validateEntry(entry);
    if (issues.length) throw new Error('目录条目 ' + String(entry?.entryId ?? '?') + ' 无效：' + issues.slice(0, 4).join('; '));
    if (ids.has(entry.entryId) || slugs.has(entry.slug))
      throw new Error('工具库目录存在重复的编号或路径：' + entry.entryId);
    ids.add(entry.entryId);
    slugs.add(entry.slug);
    if (!HASH.test(entry.sourceFingerprint ?? ''))
      throw new Error(entry.entryId + ' 的源码摘要缺失或无效');
    if (!entry.verification || typeof entry.verification !== 'object' || Array.isArray(entry.verification))
      throw new Error(entry.entryId + ' 缺少独立验证状态');
    for (const kind of KINDS)
      if (!STATES.has(entry.verification[kind]?.status))
        throw new Error(entry.entryId + ' 的 ' + kind + ' 验证状态无效');
  }
  return value;
}
