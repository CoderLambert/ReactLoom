/** The landing page never needs demo sources, SDK versions, or verification evidence. */
import {validateCatalogPayload} from './catalog-payload.mjs';

const FINGERPRINT = /^[a-f0-9]{64}$/u;
const ID = /^[A-F]\d{2}$/u;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const GROUPS = new Set(['A','B','C','D','E','F']);
const CONTENT_STATES = new Set(['missing','imported','reviewed','recreated']);

export function toCatalogIndex(entries) {
  return entries.map(entry => ({
    entryId: entry.entryId,
    slug: entry.slug,
    name: entry.name,
    group: entry.group,
    summary: entry.summary,
    tags: entry.tags,
    contentState: entry.contentState,
    packageNames: entry.packages.map(item => item.name),
    hasDemo: entry.demos.some(demo => Boolean(demo.entryPoint)),
    demoCount: entry.demos.length,
    sourceFingerprint: entry.sourceFingerprint,
  }));
}

export function validateCatalogIndex(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 300)
    throw new Error('目录索引必须为非空、限定长度的数组');
  const ids = new Set();
  const slugs = new Set();
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item) ||
      !ID.test(item.entryId ?? '') || !GROUPS.has(item.group) ||
      item.entryId[0] !== item.group || !SLUG.test(item.slug ?? '') ||
      typeof item.name !== 'string' || !item.name.trim() ||
      typeof item.summary !== 'string' || !item.summary.trim() ||
      !CONTENT_STATES.has(item.contentState) ||
      !Array.isArray(item.tags) || !item.tags.every(tag => typeof tag === 'string') ||
      !Array.isArray(item.packageNames) || !item.packageNames.every(name => typeof name === 'string' && name.length > 0) ||
      typeof item.hasDemo !== 'boolean' ||
      !Number.isSafeInteger(item.demoCount) || item.demoCount < 0 || item.demoCount > 12 ||
      (item.hasDemo && item.demoCount === 0) ||
      !FINGERPRINT.test(item.sourceFingerprint ?? '')) {
      throw new Error('目录索引包含无效条目：' + String(item?.entryId ?? '?'));
    }
    if (ids.has(item.entryId) || slugs.has(item.slug)) throw new Error('目录索引重复：' + item.entryId);
    ids.add(item.entryId);
    slugs.add(item.slug);
  }
  return value;
}

export function validateCatalogDetail(value, summary) {
  const [detail] = validateCatalogPayload([value]);
  if (detail.entryId !== summary.entryId || detail.slug !== summary.slug ||
      detail.group !== summary.group || detail.sourceFingerprint !== summary.sourceFingerprint) {
    throw new Error('库详情与当前目录版本不匹配，请刷新后重试');
  }
  return detail;
}

export function filterCatalogIndex(entries, query = '', group = 'all', onlyDemos = false) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  return entries.filter(item => {
    if (group !== 'all' && item.group !== group) return false;
    if (onlyDemos && !item.hasDemo) return false;
    const searchable = [item.entryId, item.name, item.slug, item.summary,
      ...item.tags, ...item.packageNames].join(' ').toLocaleLowerCase();
    return terms.every(term => searchable.includes(term));
  });
}
