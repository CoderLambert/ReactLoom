import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { resolveDocumentUrl } from '../src/lib/document-utils.mjs'

test('Markdown source links use the inert transport, including HTML', () => {
  assert.equal(
    resolveDocumentUrl('examples/index.html', 'F18'),
    '/raw/F18/sources/examples/index.html.txt',
  )
  assert.equal(
    resolveDocumentUrl('examples/demo.tsx', 'C20', '/lab/'),
    '/lab/raw/C20/sources/examples/demo.tsx.txt',
  )
  assert.equal(resolveDocumentUrl('assets/script.svg', 'A01'), '')
  assert.equal(resolveDocumentUrl('../index.html', 'F18'), '')
})
test('source viewer uses the same transport mapping as the generator', async () => {
  const code = await readFile(new URL('../src/components/demo-host.tsx', import.meta.url), 'utf8')
  assert.match(code, /sourceTextPath\(current\.path\)/u)
})
