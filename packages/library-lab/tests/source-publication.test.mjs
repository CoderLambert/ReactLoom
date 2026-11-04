import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { generate } from '../scripts/generate.mjs'
import { readBoundedSourceResponse, verifySourceIndexDigest } from '../src/lib/source-integrity.mjs'

const html =
  '<!doctype html><html><script>globalThis.executed = true;</script><body>中文</body></html>\n'

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'lab-source-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const directory = path.join(root, 'entries/F18-fixture')
  await mkdir(path.join(directory, 'examples'), { recursive: true })
  const entry = {
    schemaVersion: 1,
    entryId: 'F18',
    slug: 'fixture',
    name: 'HTML fixture',
    group: 'F',
    summary: 'HTML source must remain inert text',
    tags: [],
    contentState: 'recreated',
    packages: [],
    references: [],
    related: [],
    demos: ['basic', 'business', 'advanced'].map((level) => ({
      demoId: level,
      level,
      executionKind: 'node-ci',
      entryPoint: 'examples/index.html',
      sourceFiles: ['examples/index.html', 'examples/main.ts'],
    })),
  }
  await writeFile(path.join(directory, 'library.json'), JSON.stringify(entry))
  await writeFile(path.join(directory, 'examples/index.html'), html)
  await writeFile(path.join(directory, 'examples/main.ts'), 'export const answer = 42;\n')
  await generate(root, { expectedCount: 1 })
  return root
}

test('generator publishes original HTML bytes as inert .txt and never as executable HTML', async (t) => {
  const root = await fixture(t)
  const published = path.join(root, 'public/raw/F18/sources/examples/index.html.txt')
  assert.ok(existsSync(published), 'HTML source must be published with an inert .txt suffix')
  assert.equal(existsSync(path.join(root, 'public/raw/F18/sources/examples/index.html')), false)
  assert.equal(await readFile(published, 'utf8'), html)
  const response = new Response(await readFile(published), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
  assert.equal(await readBoundedSourceResponse(response, Buffer.byteLength(html)), html)
})

test('source index retains original filenames and hashes while the transport path is inert', async (t) => {
  const root = await fixture(t)
  const index = JSON.parse(
    await readFile(path.join(root, 'public/raw/F18/source-index.json'), 'utf8'),
  )
  const detail = JSON.parse(await readFile(path.join(root, 'public/raw/F18/detail.json'), 'utf8'))
  await verifySourceIndexDigest(index, detail.sourceIndexSha256)
  assert.equal(index[0].path, 'examples/index.html')
  assert.equal(index[0].sha256, createHash('sha256').update(html).digest('hex'))
  assert.ok(existsSync(path.join(root, 'public/raw/F18/sources/examples/main.ts.txt')))
})

test('an HTML fallback at an inert source URL is still rejected', async () => {
  await assert.rejects(
    readBoundedSourceResponse(
      new Response('<html>SPA fallback</html>', { headers: { 'content-type': 'text/html' } }),
      25,
    ),
    /SPA/,
  )
})
