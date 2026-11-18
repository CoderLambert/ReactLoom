import assert from 'node:assert/strict'
import test from 'node:test'
import { clampFrame, mayPlay, playbackLabel } from '../examples/playback-policy.ts'

const normal = { loaded: true, visible: true, reduced: false, override: false }
test('foreground loaded player may animate with normal preferences', () => {
  assert.equal(mayPlay(normal), true)
  assert.equal(playbackLabel(normal, true), '正在播放')
  assert.equal(playbackLabel(normal, false), '已暂停')
})
test('loading and hidden tabs cannot play, even when motion override is set', () => {
  assert.equal(mayPlay({ ...normal, loaded: false, override: true }), false)
  assert.equal(mayPlay({ ...normal, visible: false, override: true }), false)
  assert.equal(playbackLabel({ ...normal, loaded: false }, true), '等待动画资源')
  assert.equal(playbackLabel({ ...normal, visible: false }, true), '后台暂停')
})
test('reduced motion requires explicit override', () => {
  assert.equal(mayPlay({ ...normal, reduced: true }), false)
  assert.equal(playbackLabel({ ...normal, reduced: true }, true), '按系统偏好暂停')
  assert.equal(mayPlay({ ...normal, reduced: true, override: true }), true)
  assert.equal(playbackLabel({ ...normal, reduced: true, override: true }, true), '正在播放')
})

test('frame seek uses the decoded animation range and rejects invalid measurements', () => {
  assert.equal(clampFrame(999, 60), 59)
  assert.equal(clampFrame(-4, 60), 0)
  assert.equal(clampFrame(12.8, 60), 12)
  assert.equal(clampFrame(Number.NaN, 60), 0)
  assert.equal(clampFrame(4, 0), 0)
})
