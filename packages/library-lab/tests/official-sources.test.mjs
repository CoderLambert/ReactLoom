import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { extractDocumentHeadings } from '../src/lib/document-utils.mjs'
import { resolveOfficialReadmeUrl, validateOfficialSources } from '../src/lib/official-sources.mjs'

const readme = {
  repository: 'lukeed/clsx',
  commit: '1'.repeat(40),
  path: 'docs/readme.md',
  sourceUrl: `https://github.com/lukeed/clsx/blob/${'1'.repeat(40)}/docs/readme.md`,
  snapshotPath: 'official/readme.md',
  language: 'en',
  version: '2.1.1',
  syncedAt: '2026-11-10T08:00:00Z',
  sha256: 'a'.repeat(64),
}
const official = {
  readme,
  homepage: {
    url: 'https://github.com/lukeed/clsx',
    kind: 'repository',
    status: 'blocked',
    checkedAt: '2026-11-10T08:00:00Z',
    reason: "X-Frame-Options: deny; frame-ancestors 'none'",
  },
}
test('official sources bind a snapshot to an immutable upstream file', () => {
  assert.deepEqual(validateOfficialSources(official), [])
  for (const patch of [
    { commit: 'main' },
    { sourceUrl: 'https://github.com/another/repo/blob/main/README.md' },
    { snapshotPath: '../README.md' },
    { sha256: '' },
    { syncedAt: 'invalid' },
  ])
    assert.ok(validateOfficialSources({ ...official, readme: { ...readme, ...patch } }).length)
})
test('homepage checks distinguish unknown from blocked and validate safe addresses', () => {
  for (const status of ['unknown', 'blocked', 'allowed'])
    assert.deepEqual(
      validateOfficialSources({ ...official, homepage: { ...official.homepage, status } }),
      [],
    )
  for (const patch of [
    { url: 'javascript:alert(1)' },
    { url: 'https://user:pass@example.org' },
    { status: 'loaded' },
    { checkedAt: '' },
  ])
    assert.ok(
      validateOfficialSources({ ...official, homepage: { ...official.homepage, ...patch } }).length,
    )
})
test('SheetJS canonical forge binds its actual README to the exact repository and commit', () => {
  const sheetjs = {
    ...readme,
    repository: 'sheetjs/sheetjs',
    path: 'README.md',
    version: '0.20.3',
    sourceUrl: `https://git.sheetjs.com/sheetjs/sheetjs/src/commit/${readme.commit}/README.md`,
  }
  assert.deepEqual(validateOfficialSources({ ...official, readme: sheetjs }), [])
  assert.deepEqual(
    validateOfficialSources({
      ...official,
      readme: {
        ...sheetjs,
        repository: 'SheetJS/sheetjs',
        sourceUrl: sheetjs.sourceUrl.replace('/sheetjs/sheetjs/', '/SheetJS/sheetjs/'),
      },
    }),
    [],
  )
  assert.equal(
    resolveOfficialReadmeUrl('LICENSE', sheetjs),
    `https://git.sheetjs.com/sheetjs/sheetjs/src/commit/${readme.commit}/LICENSE`,
  )
  assert.equal(
    resolveOfficialReadmeUrl('#upstream-only', sheetjs, []),
    `${sheetjs.sourceUrl}#upstream-only`,
  )
  for (const patch of [
    { repository: 'another/repository' },
    { sourceUrl: sheetjs.sourceUrl.replace('git.sheetjs.com/', 'git.sheetjs.com.evil.test/') },
    { sourceUrl: sheetjs.sourceUrl.replace('/src/commit/', '/src/branch/') },
    { sourceUrl: sheetjs.sourceUrl.replace(readme.commit, '2'.repeat(40)) },
    { sourceUrl: `${sheetjs.sourceUrl}?ref=main` },
    { sourceUrl: sheetjs.sourceUrl.replace('https:', 'http:') },
  ])
    assert.ok(validateOfficialSources({ ...official, readme: { ...sheetjs, ...patch } }).length)
})
test('README links resolve against the pinned upstream folder and local anchors remain local', () => {
  assert.equal(
    resolveOfficialReadmeUrl('../LICENSE', readme),
    `https://github.com/lukeed/clsx/blob/${readme.commit}/LICENSE`,
  )
  assert.equal(
    resolveOfficialReadmeUrl('usage.md#api', readme),
    `https://github.com/lukeed/clsx/blob/${readme.commit}/docs/usage.md#api`,
  )
  assert.equal(resolveOfficialReadmeUrl('#usage', readme), '#usage')
  assert.equal(
    resolveOfficialReadmeUrl('https://example.org/api', readme),
    'https://example.org/api',
  )
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,test',
    '//evil.test/',
    'https://user:pass@example.org',
    '\\evil.test',
  ])
    assert.equal(resolveOfficialReadmeUrl(url, readme), '')
})

test('actual clsx README anchors target rendered headings including h4', async () => {
  const original = await readFile(
    new URL('../entries/C20-clsx/official/readme.md', import.meta.url),
    'utf8',
  )
  const headings = extractDocumentHeadings(original)
  const ids = headings.map((heading) => heading.id)
  assert.equal(resolveOfficialReadmeUrl('#API', readme, ids), '#api')
  assert.equal(headings.find((heading) => heading.id === 'clsxlite')?.depth, 4)
  assert.equal(resolveOfficialReadmeUrl('#clsxlite', readme, ids), '#clsxlite')
  assert.equal(
    resolveOfficialReadmeUrl('#upstream-only', readme, ids),
    `${readme.sourceUrl}#upstream-only`,
  )
})

test('scoped package README folders retain exact encoded upstream identity', () => {
  const scoped = {
    ...readme,
    repository: 'mantinedev/mantine',
    path: 'packages/@mantine/core/README.md',
    sourceUrl: `https://github.com/mantinedev/mantine/blob/${readme.commit}/packages/%40mantine/core/README.md`,
  }
  assert.deepEqual(validateOfficialSources({ ...official, readme: scoped }), [])
  assert.equal(
    resolveOfficialReadmeUrl('./LICENSE', scoped),
    `https://github.com/mantinedev/mantine/blob/${readme.commit}/packages/%40mantine/core/LICENSE`,
  )
  for (const patch of [
    { path: 'packages/@mantine/../README.md' },
    { path: 'packages/@/README.md' },
    { path: 'packages/%40mantine/core/README.md' },
    { path: 'packages/@mantine/core/README.md?ref=main' },
    { sourceUrl: scoped.sourceUrl.replace('%40mantine', '@mantine') },
    { sourceUrl: scoped.sourceUrl.replace('%40mantine', '%40another') },
  ])
    assert.ok(validateOfficialSources({ ...official, readme: { ...scoped, ...patch } }).length)
})
