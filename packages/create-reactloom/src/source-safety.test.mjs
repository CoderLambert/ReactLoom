import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { assertSafeScaffoldSource } from './source-safety.ts'

async function withFixture(callback) {
  const root = await mkdtemp(path.join(tmpdir(), 'reactloom-manifest-source-'))
  try {
    await callback(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('accepts a regular manifest-selected source and allows its contents to be read', async () => {
  await withFixture(async (root) => {
    const source = path.join(root, 'docs', 'best-practices', 'intro.md')
    await mkdir(path.dirname(source), { recursive: true })
    await writeFile(source, '# Public guide\n')
    await assertSafeScaffoldSource(root, 'docs/best-practices/intro.md')
    assert.equal(await readFile(source, 'utf8'), '# Public guide\n')
  })
})

test('rejects a manifest-selected symlink file before reading its target', async () => {
  await withFixture(async (root) => {
    await mkdir(path.join(root, 'docs'))
    await writeFile(path.join(root, 'secret.md'), 'synthetic-only')
    await symlink(path.join(root, 'secret.md'), path.join(root, 'docs', 'guide.md'))
    await assert.rejects(
      assertSafeScaffoldSource(root, 'docs/guide.md'),
      /Template source symlinks are not allowed: docs\/guide\.md/,
    )
  })
})

test('rejects symlinked parents for adapted docs, tsconfig presets and AI pointers', async () => {
  await withFixture(async (root) => {
    const outside = await mkdtemp(path.join(tmpdir(), 'reactloom-outside-'))
    try {
      await writeFile(path.join(outside, 'fake.md'), 'synthetic-only')
      await symlink(outside, path.join(root, 'docs'))
      await symlink(outside, path.join(root, '.cursor'))
      await mkdir(path.join(root, 'packages'))
      await symlink(outside, path.join(root, 'packages', 'tsconfig'))
      for (const selected of [
        'docs/fake.md',
        '.cursor/fake.md',
        'packages/tsconfig/fake.md',
      ]) {
        await assert.rejects(assertSafeScaffoldSource(root, selected), /symlinks are not allowed/)
      }
    } finally {
      await rm(outside, { recursive: true, force: true })
    }
  })
})

test('rejects traversal and absolute paths before reaching the filesystem', async () => {
  await withFixture(async (root) => {
    await assert.rejects(assertSafeScaffoldSource(root, '../outside'), /inside the repository/)
    await assert.rejects(assertSafeScaffoldSource(root, root), /inside the repository/)
    await assert.rejects(
      assertSafeScaffoldSource(root, path.join(root, '..', 'outside')),
      /inside the repository/,
    )
  })
})
