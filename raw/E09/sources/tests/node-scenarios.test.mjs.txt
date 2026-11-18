import assert from 'node:assert/strict'
import test from 'node:test'
import { highlightSource } from '../examples/highlight.mjs'

test('real Shiki tokenizes TypeScript preserving source content', async () => {
  const src = 'const count: number = 2'
  const tokens = await highlightSource(src, 'typescript')
  assert.equal(tokens.map((row) => row.map((token) => token.content).join('')).join('\n'), src)
})
test('real Shiki returns text tokens rather than executable DOM', async () => {
  const src = '<script>alert(1)</script>'
  const tokens = await highlightSource(src, 'html')
  assert.equal(
    tokens
      .flat()
      .map((token) => token.content)
      .join(''),
    src,
  )
})

test('real Shiki preserves multiline source and non-ASCII text across tokens', async () => {
  const src = 'const 标题 = "新闻";\nconsole.log(标题);'
  const tokens = await highlightSource(src, 'typescript')
  assert.equal(tokens.map((row) => row.map((token) => token.content).join('')).join('\n'), src)
})

test('actual UI runtime supports JSON language with color metadata', async () => {
  const source = '{"ready":true,"count":3}'
  const tokens = await highlightSource(source, 'json')
  assert.equal(
    tokens
      .flat()
      .map((t) => t.content)
      .join(''),
    source,
  )
  assert.ok(tokens.flat().some((t) => typeof t.color === 'string'))
})
