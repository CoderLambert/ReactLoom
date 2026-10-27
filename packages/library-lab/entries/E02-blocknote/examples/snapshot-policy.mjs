// Snapshot guard for the free, text-only BlockNote laboratory. Does not replace SDK schema validation.
export const MAX_SNAPSHOT = 60_000;
const BLOCK_TYPES = new Set(['paragraph','heading','bulletListItem','numberedListItem','checkListItem','toggleListItem','quote','codeBlock']);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function copyJson(value, depth = 0) {
  if (depth > 12) throw new Error('内容嵌套过深');
  if (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return value;
  if (typeof value === 'string' && value.length <= 20_000) return value;
  if (Array.isArray(value)) {
    if (value.length > 500) throw new Error('内容数组超限');
    return value.map(item => copyJson(item, depth + 1));
  }
  if (!record(value) || Object.keys(value).length > 32) throw new Error('内容字段不合法');
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (['__proto__','prototype','constructor'].includes(key) || /^on/i.test(key)) throw new Error('禁止的内容属性');
    if (['href','url','src'].includes(key)) {
      if (typeof item !== 'string' || /[\u0000-\u0020\u007f\\]/u.test(item)) throw new Error('外链字段非法');
      let url;
      try {url = new URL(item);} catch {throw new Error('外链必须是合法 HTTPS 地址');}
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('不接受带凭据/非 HTTPS 外链');
    }
    result[key] = copyJson(item, depth + 1);
  }
  return result;
}

export function parseBlockSnapshot(raw) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_SNAPSHOT) throw new Error('草稿大小超限');
  const blocks = JSON.parse(raw);
  if (!Array.isArray(blocks) || blocks.length === 0 || blocks.length > 100) throw new Error('块数量不合法');
  let total = 0;
  function normalize(block, depth = 0) {
    if (!record(block) || depth > 8 || ++total > 100 || !BLOCK_TYPES.has(block.type)) throw new Error('不支持的块类型或深度');
    if (Object.keys(block).some(key => !['id','type','props','content','children'].includes(key))) throw new Error('块字段不合法');
    if (block.content !== undefined && typeof block.content !== 'string' && !Array.isArray(block.content)) throw new Error('内联内容非法');
    const output = {type: block.type};
    if (block.props !== undefined) output.props = copyJson(block.props);
    if (block.content !== undefined) output.content = copyJson(block.content);
    if (block.children !== undefined) {
      if (!Array.isArray(block.children) || block.children.length > 100) throw new Error('子块数量异常');
      output.children = block.children.map(child => normalize(child, depth + 1));
    }
    // Do not reuse persisted live editor IDs; BlockNote assigns IDs to the fresh replacement.
    return output;
  }
  return blocks.map(block => normalize(block));
}
