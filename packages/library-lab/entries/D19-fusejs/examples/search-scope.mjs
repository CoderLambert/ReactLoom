/** Search-view policy. Group is a UI filter, NEVER an authorization boundary. */
const groups = new Set(['技术', '商业', '开源'])
const thresholds = new Set([0, 0.15, 0.35, 0.55])
export function normalizeQuery(value) {
  if (typeof value !== 'string') return ''
  const cleaned = Array.from(value.normalize('NFC'))
    .filter((character) => {
      const point = character.codePointAt(0)
      return point >= 32 && point !== 127
    })
    .join('')
    .trim()
  return Array.from(cleaned).slice(0, 80).join('')
}
export function resolveScope({ level, group, threshold }) {
  if (!['basic', 'business', 'advanced'].includes(level)) throw new TypeError('invalid demo level')
  return {
    group: level === 'basic' ? '全部' : groups.has(group) ? group : '全部',
    threshold: level === 'advanced' && thresholds.has(threshold) ? threshold : 0.35,
  }
}
export function visibleDocuments(documents, group) {
  if (!Array.isArray(documents)) throw new TypeError('documents must be an array')
  return group === '全部' ? documents : documents.filter((doc) => doc.group === group)
}
