import assert from 'node:assert/strict'
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { shouldCopyScaffoldEntry } from './copy-filter.ts'

const SKIPPED = new Set(['node_modules', 'dist', '.next', '.expo', 'coverage', 'playwright-report', 'test-results', '.turbo', 'storybook-static', '.git'])

test('excludes local environment files and nested Git metadata', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'reactloom-copy-filter-'))
  try {
    const source = path.join(root, 'template')
    const target = path.join(root, 'generated')
    await mkdir(path.join(source, 'src'), { recursive: true })
    await mkdir(path.join(source, '.git'), { recursive: true })
    await mkdir(path.join(source, 'src', 'nested'), { recursive: true })
    for (const name of ['.env', '.env.local', '.env.production', '.env.staging.local']) {
      await writeFile(path.join(source, name), `secret-${name}`)
    }
    for (const name of ['.env.example', '.env.development', '.gitignore', 'package.json']) {
      await writeFile(path.join(source, name), `safe-${name}`)
    }
    await writeFile(path.join(source, 'src', '.env.test.local'), 'nested-secret')
    await writeFile(path.join(source, 'src', 'nested', 'app.ts'), 'export const value = 1')
    await writeFile(path.join(source, '.git', 'config'), 'private remote')
    await cp(source, target, {
      recursive: true,
      filter: entry => shouldCopyScaffoldEntry(entry, SKIPPED),
    })
    for (const relative of ['.env', '.env.local', '.env.production', '.env.staging.local', 'src/.env.test.local', '.git/config']) {
      await assert.rejects(readFile(path.join(target, relative), 'utf8'), { code: 'ENOENT' })
    }
    for (const name of ['.env.example', '.env.development', '.gitignore', 'package.json']) {
      assert.equal(await readFile(path.join(target, name), 'utf8'), `safe-${name}`)
    }
    assert.equal(await readFile(path.join(target, 'src', 'nested', 'app.ts'), 'utf8'), 'export const value = 1')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('excludes generated caches but retains unrelated hidden files', () => {
  for (const entry of ['.git', 'node_modules', 'dist', 'state.tsbuildinfo', '.env.local', '.env.production.local']) {
    assert.equal(shouldCopyScaffoldEntry(`/source/${entry}`, SKIPPED), false, entry)
  }
  for (const entry of ['.gitignore', '.env.development', '.env.example', '.editorconfig', 'app.tsx']) {
    assert.equal(shouldCopyScaffoldEntry(`/source/${entry}`, SKIPPED), true, entry)
  }
})
