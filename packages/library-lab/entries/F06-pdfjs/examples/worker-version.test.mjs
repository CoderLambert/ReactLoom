import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

const load = async url => JSON.parse(await readFile(url, 'utf8'))

test('F06, F07 and the app agree on the React-PDF 11 PDF.js version', async () => {
  const [manifest, native, react] = await Promise.all([
    load(new URL('../../../package.json', import.meta.url)),
    load(new URL('../library.json', import.meta.url)),
    load(new URL('../../F07-react-pdf/library.json', import.meta.url)),
  ])
  const nativeVersion = native.packages.find(p => p.name === 'pdfjs-dist').version
  const reactVersion = react.packages.find(p => p.name === 'pdfjs-dist').version
  const expected = '6.3.289' // react-pdf@11.0.0 exact upstream PDF.js baseline
  assert.equal(manifest.dependencies['react-pdf'], '11.0.0')
  assert.equal(nativeVersion, expected)
  assert.equal(reactVersion, expected)
  assert.equal(manifest.dependencies['pdfjs-dist'], expected)
})

test('both examples point at the local pdfjs-dist worker, never a CDN', async () => {
  const [native, react] = await Promise.all([
    readFile(new URL('./example.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../F07-react-pdf/examples/example.tsx', import.meta.url), 'utf8'),
  ])
  for (const source of [native, react]) {
    assert.match(source, /pdfjs-dist\/build\/pdf\.worker\.min\.mjs\?url/u)
    assert.doesNotMatch(source, /unpkg\.com|jsdelivr\.net/u)
  }
})
