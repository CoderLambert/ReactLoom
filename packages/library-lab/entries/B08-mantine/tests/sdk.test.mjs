import assert from 'node:assert/strict'
import test from 'node:test'
import { Button, createTheme, MantineProvider, NumberInput, Table, TextInput } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createLocalColorSchemeManager } from '../examples/local-color-scheme.ts'

function render(children) {
  return renderToStaticMarkup(
    h(
      'section',
      { 'data-b08-root': 'sdk' },
      h(
        MantineProvider,
        {
          theme: createTheme({ primaryColor: 'teal' }),
          forceColorScheme: 'light',
          colorSchemeManager: createLocalColorSchemeManager(),
          cssVariablesSelector: '[data-b08-root="sdk"]',
          getRootElement: () => undefined,
          withGlobalClasses: false,
        },
        children,
      ),
    ),
  )
}
test('real scoped Mantine provider generates variables and accessible static controls', () => {
  const html = render(
    h(
      'div',
      null,
      h(TextInput, { id: 'b08-sdk-workspace', label: '工作区', defaultValue: 'ReactLoom' }),
      h(Button, { disabled: true }, '确认工作区'),
    ),
  )
  assert.equal(typeof document, 'undefined')
  assert.match(html, /data-b08-root/)
  assert.match(html, /--mantine-primary-color/)
  assert.match(html, /for="b08-sdk-workspace"/)
  assert.match(html, /disabled=""/)
  console.log('Real scoped Mantine SSR bytes:', Buffer.byteLength(html))
})
function Probe() {
  const [value] = useDebouncedValue('AI', 150)
  return h('output', { 'data-debounced': value }, value)
}
test('real NumberInput and hook initial value render; no browser timer/Portal claim', () => {
  const html = render(
    h(
      'div',
      null,
      h(Probe),
      h(NumberInput, {
        id: 'b08-sdk-quota',
        label: '每小时请求上限',
        value: 15,
        onChange: () => {},
        min: 1,
        max: 100,
        clampBehavior: 'none',
        decimalScale: 2,
      }),
      h(
        Table,
        null,
        h(
          Table.Tbody,
          null,
          h(
            Table.Tr,
            { 'data-feed-id': 'frontend' },
            h(Table.Th, { scope: 'row' }, '前端实践'),
            h(Table.Td, null, '15'),
          ),
        ),
      ),
    ),
  )
  assert.match(html, /data-debounced="AI"/)
  assert.match(html, /value="15"/)
  assert.match(html, /for="b08-sdk-quota"/)
  assert.match(html, /data-feed-id="frontend"/)
  console.log('Real NumberInput/hook initial SSR bytes:', Buffer.byteLength(html))
})
