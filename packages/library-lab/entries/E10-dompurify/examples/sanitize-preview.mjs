import { htmlPolicy } from './html-policy.mjs'
export const MAX_INPUT_UNITS = 12_000
export function sanitizePreview(dirty, purifier) {
  if (typeof dirty !== 'string' || dirty.length > MAX_INPUT_UNITS)
    return { html: '', error: '输入超过12,000个UTF-16单元，已清空HTML预览' }
  if (purifier.isSupported !== true)
    return { html: '', error: '当前DOM环境不支持净化，已停用HTML预览；原文仅作为文本保留' }
  try {
    const html = purifier.sanitize(dirty, htmlPolicy)
    if (typeof html !== 'string') throw new TypeError('本例只接受字符串净化结果')
    return { html, error: '' }
  } catch (error) {
    return { html: '', error: `净化失败，已清空HTML预览：${String(error)}` }
  }
}
