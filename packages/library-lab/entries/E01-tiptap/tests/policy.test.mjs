import assert from 'node:assert/strict'
import test from 'node:test'
import { MAX_SNAPSHOT, parseTiptapSnapshot } from '../examples/snapshot-policy.mjs'

const doc = (content) => JSON.stringify({ type: 'doc', content })
test('StarterKit paragraph/format JSON stays usable', () => {
  const parsed = parseTiptapSnapshot(
    doc([
      { type: 'paragraph', content: [{ type: 'text', text: '你好', marks: [{ type: 'bold' }] }] },
    ]),
  )
  assert.equal(parsed.content[0].content[0].text, '你好')
})
test('rejects malformed/oversized/empty documents without recovery', () => {
  for (const raw of ['{', '{}', doc([]), 'x'.repeat(MAX_SNAPSHOT + 1)])
    assert.throws(() => parseTiptapSnapshot(raw))
})
test('rejects dangerous attributes, unknown nodes and unbounded depth', () => {
  for (const node of [
    { type: 'image', attrs: { src: 'https://example.com/t.png' } },
    {
      type: 'text',
      text: 'bad',
      marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
    },
    { type: 'heading', attrs: { onload: 'evil' } },
  ])
    assert.throws(() => parseTiptapSnapshot(doc([node])))
  let nested = { type: 'paragraph' }
  for (let i = 0; i < 16; i++) nested = { type: 'blockquote', content: [nested] }
  assert.throws(() => parseTiptapSnapshot(doc([nested])))
})
test('allows safe HTTPS links while rejecting embedded credentials', () => {
  const node = (href) =>
    doc([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href } }] }],
      },
    ])
  assert.doesNotThrow(() => parseTiptapSnapshot(node('https://example.com/page')))
  assert.throws(() => parseTiptapSnapshot(node('https://user:pass@example.com/')))
})

test('storage empty, quota and denied access are visible failures without other keys', async () => {
  const { saveDraft, readDraft, DRAFT_KEY } = await import('../examples/snapshot-storage.mjs')
  const values = new Map([['unrelated', 'keep']])
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  assert.throws(() => readDraft(storage), /没有保存/)
  const valid = { type: 'doc', content: [{ type: 'paragraph' }] }
  saveDraft(storage, valid)
  assert.deepEqual(readDraft(storage), valid)
  assert.equal(values.get('unrelated'), 'keep')
  assert.ok(values.has(DRAFT_KEY))
  values.set(DRAFT_KEY, '')
  assert.throws(() => readDraft(storage))
  values.set(DRAFT_KEY, '{')
  assert.throws(() => readDraft(storage))
  assert.throws(
    () =>
      saveDraft(
        {
          setItem() {
            throw new Error('QuotaExceededError')
          },
        },
        valid,
      ),
    /Quota/,
  )
  assert.throws(
    () =>
      readDraft({
        getItem() {
          throw new Error('SecurityError')
        },
      }),
    /Security/,
  )
  assert.throws(
    () =>
      saveDraft(storage, {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'x'.repeat(MAX_SNAPSHOT) }] },
        ],
      }),
    /限制/,
  )
  assert.equal(values.get('unrelated'), 'keep')
})
