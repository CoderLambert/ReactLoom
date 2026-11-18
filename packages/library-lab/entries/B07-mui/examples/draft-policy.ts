export type DraftErrors = { title?: string; url?: string }
export type DraftResult =
  | { valid: false; errors: DraftErrors }
  | { valid: true; title: string; endpoint: string }

/** Local field validation, not a remote request or service authorization. */
export function validateFeedDraft(title: string, url: string): DraftResult {
  const errors: DraftErrors = {}
  const label = title.trim()
  if (!label || label.length > 60) errors.title = '名称必须为1–60个字符'
  let endpoint = ''
  try {
    const parsed = new URL(url.trim())
    if (parsed.protocol !== 'https:') throw new Error('HTTPS required')
    endpoint = parsed.href
  } catch {
    errors.url = '请输入完整HTTPS订阅地址'
  }
  return Object.keys(errors).length
    ? { valid: false, errors }
    : { valid: true, title: label, endpoint }
}
