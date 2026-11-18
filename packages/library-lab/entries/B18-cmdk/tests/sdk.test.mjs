import assert from 'node:assert/strict'
import test from 'node:test'
import { Command, defaultFilter } from 'cmdk'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('actual cmdk defaultFilter searches explicit bilingual keywords while keeping an independent item id', () => {
  const scores = {
    chinese: defaultFilter('save', '收藏', ['稍后阅读', '收藏', 'bookmark']),
    english: defaultFilter('refresh', 'RSS', ['模拟刷新订阅', 'rss']),
    absent: defaultFilter('save', '没有这条命令', ['稍后阅读', '收藏', 'bookmark']),
  }
  assert.ok(scores.chinese > 0 && scores.chinese <= 1)
  assert.ok(scores.english > 0 && scores.english <= 1)
  assert.equal(scores.absent, 0)
  console.log('Actual defaultFilter scores:', scores)
})

test('actual cmdk SSR exposes labelled combobox/listbox and disabled option markup', () => {
  const html = renderToStaticMarkup(
    h(
      Command,
      { label: '测试命令搜索' },
      h(Command.Input),
      h(
        Command.List,
        { label: '测试候选' },
        h(Command.Item, { value: 'save' }, '稍后阅读'),
        h(Command.Item, { value: 'delete', disabled: true }, '删除所有订阅'),
      ),
    ),
  )
  assert.equal(typeof document, 'undefined')
  assert.match(html, /cmdk-root=""/)
  assert.match(html, /role="combobox"/)
  assert.match(html, /role="listbox"/)
  assert.match(html, /role="option"[^>]*aria-disabled="true"/)
  const label = html.match(/<label[^>]*id="([^"]+)"[^>]*>测试命令搜索<\/label>/)
  assert.ok(label, 'SDK creates the label used by its Input')
  assert.ok(html.includes(`aria-labelledby="${label[1]}"`))
  // SSR checks markup only. Live filtering, selected state, Dialog and keyboard need the browser.
})
