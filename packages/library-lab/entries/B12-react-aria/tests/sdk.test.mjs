import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h, useId } from 'react'
import {
  Button,
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Text,
} from 'react-aria-components'
import { renderToStaticMarkup } from 'react-dom/server'

function Probe({ modern = false }) {
  const hint = useId()
  const selection = modern
    ? { value: 'react', onChange: () => {} }
    : { selectedKey: 'react', onSelectionChange: () => {} }
  return h(
    'form',
    null,
    h(
      ComboBox,
      {
        ...selection,
        inputValue: 'React 组件工程',
        onInputChange: () => {},
        name: 'channel',
        allowsEmptyCollection: true,
      },
      h(Label, null, '选择 RSS 频道'),
      h(Input, { 'aria-describedby': hint }),
      h(Button, { 'aria-label': '显示可选频道' }, '展开'),
      h(Text, { slot: 'description', id: hint }, '使用方向键选择'),
      h(
        Popover,
        null,
        h(
          ListBox,
          null,
          h(ListBoxItem, { id: 'react', textValue: 'React 组件工程' }, 'React 组件工程'),
        ),
      ),
    ),
  )
}
function assertKeyAndInput(html) {
  assert.equal(typeof document, 'undefined')
  const inputs = html.match(/<input\b[^>]*>/g) ?? []
  assert.ok(
    inputs.some(
      (tag) => /type="hidden"/.test(tag) && /name="channel"/.test(tag) && /value="react"/.test(tag),
    ),
  )
  const combo = inputs.find((tag) => /role="combobox"/.test(tag))
  assert.ok(combo)
  assert.match(combo, /value="React 组件工程"/)
  assert.match(combo, /aria-describedby="[^"]+"/)
  assert.match(combo, /aria-expanded="false"/)
}
test('real ComboBox compatibility selection serializes key and controlled text into distinct inputs', () => {
  const html = renderToStaticMarkup(h(Probe))
  assertKeyAndInput(html)
  console.log('Actual legacy-prop ComboBox SSR bytes:', Buffer.byteLength(html))
})
test('matching 1.21 also supports value/onChange and per-instance description identities', () => {
  const html = renderToStaticMarkup(
    h('div', null, h(Probe, { modern: true }), h(Probe, { modern: true })),
  )
  assertKeyAndInput(html)
  const ids = [...html.matchAll(/aria-describedby="([^"]+)"/g)].map((match) => match[1])
  assert.equal(ids.length, 2)
  assert.notEqual(ids[0], ids[1])
  for (const id of ids) assert.ok(html.includes(`id="${id}"`))
  console.log('Actual modern-prop two-instance SSR bytes:', Buffer.byteLength(html))
})
