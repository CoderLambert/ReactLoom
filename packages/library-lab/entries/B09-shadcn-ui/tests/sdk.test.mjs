import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { transformWithOxc } from 'vite'

// Transform the actual source in memory, then load its real npm imports.
// This is a source-component SSR check, not a CLI or Registry provenance test.
const buttonUrl = new URL('../examples/ui/button.tsx', import.meta.url)
const transformed = await transformWithOxc(
  await readFile(buttonUrl, 'utf8'),
  fileURLToPath(buttonUrl),
  {
    jsx: { runtime: 'automatic' },
  },
)
const code = transformed.code.replace(
  /(from\s*)(['"])([^'"]+)\2/g,
  (_match, prefix, quote, specifier) => {
    const resolved = specifier.startsWith('.')
      ? new URL(specifier, buttonUrl).href
      : import.meta.resolve(specifier)
    return `${prefix}${quote}${resolved}${quote}`
  },
)
const { Button, buttonVariants, cn } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
)

test('actual Button classes use CVA and merge the caller spacing after the selected size', () => {
  const selected = buttonVariants({ variant: 'outline', size: 'sm' })
  assert.match(selected, /border-emerald-500/)
  assert.match(selected, /h-8/)
  const merged = cn(selected, 'px-8')
  assert.ok(merged.split(' ').includes('px-8'))
  assert.ok(!merged.split(' ').includes('px-3'))
})

test('actual default Button remains a native disabled button and defaults to type button', () => {
  const html = renderToStaticMarkup(createElement(Button, { disabled: true }, '归档'))
  assert.match(html, /^<button\b/)
  assert.match(html, /type="button"/)
  assert.match(html, /disabled=""/)
  assert.match(html, /data-variant="default"/)
})

test('actual asChild executes Radix Slot and keeps a single native link root', () => {
  const html = renderToStaticMarkup(
    createElement(
      Button,
      { asChild: true, variant: 'outline' },
      createElement('a', { href: '#b09-slot-target' }, '示例详情'),
    ),
  )
  assert.match(html, /^<a\b/)
  assert.match(html, /href="#b09-slot-target"/)
  assert.match(html, /data-slot="button"/)
  assert.doesNotMatch(html, /<button\b|type="button"/)
  const unavailable = renderToStaticMarkup(
    createElement(
      Button,
      { asChild: true },
      createElement('span', { 'aria-disabled': true }, '不可用'),
    ),
  )
  assert.match(unavailable, /^<span\b/)
  assert.match(unavailable, /aria-disabled="true"/)
  assert.doesNotMatch(unavailable, /href=|tabindex=/)
})

test('actual Slot rejects multiple root children', () => {
  assert.throws(
    () =>
      renderToStaticMarkup(
        createElement(Button, { asChild: true }, [
          createElement('a', { key: 'one', href: '#one' }, '一'),
          createElement('a', { key: 'two', href: '#two' }, '二'),
        ]),
      ),
    /single React element/,
  )
})
