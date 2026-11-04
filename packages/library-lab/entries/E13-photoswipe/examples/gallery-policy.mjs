// DOM-independent selection for one lightbox instance, not a security validator for SVG bytes.
export function visibleArtwork(items, level, extra = false) {
  const limit = level === 'basic' ? 1 : level === 'business' ? 3 : level === 'advanced' ? (extra ? 4 : 3) : 0;
  if (!limit) throw new Error('未知图库场景');
  const selected = items.slice(0, limit);
  const seen = new Set();
  for (const item of selected) {
    if (!Number.isSafeInteger(item?.id) || seen.has(item.id) || !item.src || typeof item.src !== 'string' ||
        typeof item.alt !== 'string' || !item.alt.trim() || !Number.isSafeInteger(item.width) ||
        !Number.isSafeInteger(item.height) || item.width < 1 || item.height < 1 ||
        item.width > 32768 || item.height > 32768) {
      throw new Error('图库图片ID、来源、说明或原始尺寸无效');
    }
    seen.add(item.id);
  }
  return selected;
}
