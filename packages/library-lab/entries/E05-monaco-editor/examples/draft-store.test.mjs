import assert from 'node:assert/strict'
import test from 'node:test'
import { clearDraft, DRAFT_KEY, loadDraft, saveDraft } from './draft-store.mjs'

function memoryStorage() {
  const values = new Map([['another-app', 'keep']])
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('explicit draft round-trip preserves empty text and clears only the owned key', () => {
  const storage = memoryStorage()
  assert.equal(loadDraft(storage), null)
  const draft = saveDraft(storage, '', '2026-11-10T00:00:00.000Z')
  assert.deepEqual(loadDraft(storage), draft)
  clearDraft(storage)
  assert.equal(loadDraft(storage), null)
  assert.equal(storage.values.get('another-app'), 'keep')
})

test('rejects malformed, incompatible and oversized data without overwriting it', () => {
  const storage = memoryStorage()
  for (const raw of [
    '{broken',
    JSON.stringify({ version: 2, language: 'typescript', code: 'old', savedAt: '2026-11-10' }),
    JSON.stringify({ version: 1, language: 'json', code: '{}', savedAt: '2026-11-10' }),
    JSON.stringify({ version: 1, language: 'typescript', code: 'text', savedAt: 'invalid' }),
  ]) {
    storage.setItem(DRAFT_KEY, raw)
    assert.throws(() => loadDraft(storage))
    assert.equal(storage.getItem(DRAFT_KEY), raw)
  }
  assert.throws(() => saveDraft(storage, 'x'.repeat(200_001)), /200000/u)
})

test('storage denial propagates so the UI can report failure instead of claiming a save', () => {
  const denied = () => {
    throw new Error('storage denied')
  }
  const storage = { getItem: denied, setItem: denied, removeItem: denied }
  assert.throws(() => loadDraft(storage), /storage denied/u)
  assert.throws(() => saveDraft(storage, 'text'), /storage denied/u)
  assert.throws(() => clearDraft(storage), /storage denied/u)
})
