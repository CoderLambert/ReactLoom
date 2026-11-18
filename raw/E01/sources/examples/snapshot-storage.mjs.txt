import { MAX_SNAPSHOT, parseTiptapSnapshot } from './snapshot-policy.mjs'
export const DRAFT_KEY = 'reactloom.lab.E01.tiptap.draft.v1'
export function saveDraft(storage, document) {
  const raw = JSON.stringify(document)
  if (raw.length > MAX_SNAPSHOT) throw new Error('草稿超过20000字符限制')
  parseTiptapSnapshot(raw)
  storage.setItem(DRAFT_KEY, raw)
  return raw.length
}
export function readDraft(storage) {
  const raw = storage.getItem(DRAFT_KEY)
  if (raw === null) throw new Error('没有保存过草稿')
  return parseTiptapSnapshot(raw)
}
