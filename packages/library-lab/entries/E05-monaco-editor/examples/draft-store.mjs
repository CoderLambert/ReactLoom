/** Own exactly one sessionStorage key; never clear the storage area. */
export const DRAFT_KEY = 'reactloom-library:e05:typescript-draft:v1'
const MAX_CHARACTERS = 200_000

function validateDraft(value) {
  if (
    value?.version !== 1 ||
    value.language !== 'typescript' ||
    typeof value.code !== 'string' ||
    value.code.length > MAX_CHARACTERS ||
    typeof value.savedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.savedAt))
  ) {
    throw new Error('草稿格式不兼容或内容超过 200000 字符；可清除本例草稿后重试')
  }
  return { version: 1, language: 'typescript', code: value.code, savedAt: value.savedAt }
}

export function loadDraft(storage) {
  const raw = storage.getItem(DRAFT_KEY)
  if (raw === null) return null
  // JSON escaping can expand one character sixfold. Bound before parsing.
  if (raw.length > MAX_CHARACTERS * 6 + 1024) throw new Error('本例草稿数据过大')
  return validateDraft(JSON.parse(raw))
}

export function saveDraft(storage, code, savedAt = new Date().toISOString()) {
  const draft = validateDraft({ version: 1, language: 'typescript', code, savedAt })
  storage.setItem(DRAFT_KEY, JSON.stringify(draft))
  return draft
}

export function clearDraft(storage) {
  storage.removeItem(DRAFT_KEY)
}
