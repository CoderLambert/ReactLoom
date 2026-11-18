import assert from 'node:assert/strict'
import test from 'node:test'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('real asChild closed Trigger renders one native button with menu ARIA', () => {
  const html = renderToStaticMarkup(
    h(
      DropdownMenu.Root,
      { open: false, onOpenChange: () => {} },
      h(DropdownMenu.Trigger, { asChild: true }, h('button', { type: 'button' }, '更多操作')),
      h(
        DropdownMenu.Portal,
        null,
        h(DropdownMenu.Content, null, h(DropdownMenu.Item, null, '未挂载菜单')),
      ),
    ),
  )
  assert.equal(typeof document, 'undefined')
  assert.equal((html.match(/<button/g) ?? []).length, 1)
  assert.match(html, /aria-haspopup="menu"/)
  assert.match(html, /aria-expanded="false"/)
  assert.doesNotMatch(html, /未挂载菜单/)
  console.log('Real closed Trigger SSR:', html)
})
test('real inline forceMount Content exposes static checkbox/radio/disabled semantics', () => {
  const html = renderToStaticMarkup(
    h(
      DropdownMenu.Root,
      { open: true, onOpenChange: () => {}, modal: false },
      h(DropdownMenu.Trigger, null, '更多操作'),
      // Public forceMount without Portal lets SSR inspect actual components. Not the Demo/browser path.
      h(
        DropdownMenu.Content,
        { forceMount: true, 'aria-label': '订阅操作' },
        h(DropdownMenu.CheckboxItem, { checked: true }, '收藏置顶'),
        h(
          DropdownMenu.RadioGroup,
          { value: 'popular' },
          h(DropdownMenu.RadioItem, { value: 'new' }, '最新优先'),
          h(DropdownMenu.RadioItem, { value: 'popular' }, '热度优先'),
        ),
        h(DropdownMenu.Item, { disabled: true }, '删除当前订阅'),
      ),
    ),
  )
  const checkbox = html.match(/<[^>]*role="menuitemcheckbox"[^>]*>/)?.[0]
  assert.ok(checkbox)
  assert.match(checkbox, /aria-checked="true"/)
  assert.equal((html.match(/role="menuitemradio"/g) ?? []).length, 2)
  assert.equal((html.match(/aria-checked="true"/g) ?? []).length, 2)
  assert.match(html, /aria-disabled="true"/)
  console.log('Real inline menu SSR bytes:', Buffer.byteLength(html))
})
// Static React/SDK output only. Keyboard/Portal/selection lifetime/focus requires real browser.
