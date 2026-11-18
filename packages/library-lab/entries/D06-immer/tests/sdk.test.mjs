import assert from 'node:assert/strict'
import test from 'node:test'
import { applyPatches, enablePatches, produce, produceWithPatches } from 'immer'
import { takeUndo } from '../examples/patch-ownership.mjs'

enablePatches()
test('actual Immer updates nested branch without mutating input', () => {
  const initial = { config: { name: '技术' }, list: [{ id: 'x', read: false }] }
  const next = produce(initial, (draft) => {
    draft.config.name = '开源'
  })
  assert.equal(initial.config.name, '技术')
  assert.equal(next.config.name, '开源')
  assert.equal(next.list, initial.list)
  assert.notEqual(next.config, initial.config)
})
test('actual inverse patches undo a single isolated optimistic update', () => {
  const initial = { revision: 1, list: [{ id: 'x', read: false }] }
  const [next, changes, inverse] = produceWithPatches(initial, (draft) => {
    draft.list[0].read = true
    draft.revision++
  })
  assert.ok(changes.length > 0)
  assert.ok(inverse.length > 0)
  assert.deepEqual(applyPatches(next, inverse), initial)
})

test('deferred rollback keeps inverse patches after clearing the ref', () => {
  const initial = { revision: 1, list: [{ id: 'rss-1', read: false }] }
  const [next, , inverse] = produceWithPatches(initial, (draft) => {
    draft.revision++
    draft.list.unshift({ id: 'rss-2', read: false })
  })
  const ref = { current: inverse }
  const claimed = takeUndo(ref)
  assert.equal(ref.current, null)
  assert.deepEqual(applyPatches(next, claimed), initial)
})

// Exercise the same portable model imported by the React demonstration.
import {
  initialState,
  markAllRead,
  referenceReport,
  renameFeed,
  toggleStory,
} from '../examples/feed-model.mjs'

test('demo rename copies ancestors, shares every story and preserves previous snapshot', () => {
  const base = structuredClone(initialState)
  const next = renameFeed(base, '开源')
  assert.equal(base.section.name, '前端工程')
  assert.equal(next.section.name, '开源')
  assert.deepEqual(referenceReport(base, next), {
    rootShared: false,
    sectionShared: false,
    storiesArrayShared: true,
    stories: [
      { id: 's1', shared: true },
      { id: 's2', shared: true },
    ],
  })
  assert.equal(renameFeed(next, ' 开源 '), next)
  assert.equal(renameFeed(base, '  ').section.name, '未命名分类')
})
test('demo ID update shares untouched row and unknown ID is no-op', () => {
  const base = structuredClone(initialState)
  const next = toggleStory(base, 's1')
  assert.equal(base.section.stories[0].read, false)
  assert.equal(next.section.stories[0].read, true)
  assert.equal(next.section.stories[1], base.section.stories[1])
  assert.notEqual(next.section.stories[0], base.section.stories[0])
  assert.equal(toggleStory(next, 'missing'), next)
})
test('demo batch increments once and repeated batch returns identical root', () => {
  const base = structuredClone(initialState)
  const next = markAllRead(base)
  assert.equal(next.revision, base.revision + 1)
  assert.ok(next.section.stories.every((story) => story.read))
  assert.equal(markAllRead(next), next)
})
