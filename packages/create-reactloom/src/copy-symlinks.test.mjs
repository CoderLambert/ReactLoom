import assert from 'node:assert/strict'
import { cp, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { shouldCopySafeScaffoldEntry, shouldCopyScaffoldEntry } from './copy-filter.ts'

const SKIPPED = new Set(['node_modules', '.git'])

test('rejects a symlinked file instead of carrying a reference to private content', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'reactloom-symlink-file-'))
  try {
    const source = path.join(root, 'template')
    await mkdir(path.join(source, 'src'), { recursive: true })
    const secret = path.join(root, 'synthetic-secret.txt')
    await writeFile(secret, 'SYNTHETIC_TEST_CREDENTIAL')
    await symlink(secret, path.join(source, 'src', 'token.txt'))
    const vulnerable = path.join(root, 'vulnerable')
    await cp(source, vulnerable, {
      recursive: true,
      filter: (entry) => shouldCopyScaffoldEntry(entry, SKIPPED),
    })
    assert.equal((await lstat(path.join(vulnerable, 'src', 'token.txt'))).isSymbolicLink(), true)
    await assert.rejects(
      cp(source, path.join(root, 'safe'), {
        recursive: true,
        filter: (entry) => shouldCopySafeScaffoldEntry(entry, SKIPPED),
      }),
      /Template source symlinks are not allowed/,
    )
    assert.equal(await readFile(secret, 'utf8'), 'SYNTHETIC_TEST_CREDENTIAL')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects symlinked directories while allowing valid source and root Inspector env', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'reactloom-symlink-dir-'))
  try {
    const source = path.join(root, 'template')
    const shared = path.join(root, 'external')
    await mkdir(source)
    await mkdir(shared)
    await writeFile(path.join(shared, 'data.txt'), 'do not copy')
    await symlink(shared, path.join(source, 'linked-dir'), 'dir')
    await assert.rejects(
      cp(source, path.join(root, 'blocked'), {
        recursive: true,
        filter: (entry) => shouldCopySafeScaffoldEntry(entry, SKIPPED),
      }),
      /Template source symlinks are not allowed/,
    )
    await rm(path.join(source, 'linked-dir'))
    await writeFile(path.join(source, '.env.development'), 'EXPO_PUBLIC_DEVTOOLS=true\n')
    await writeFile(path.join(source, '.env.local'), 'SYNTHETIC_TEST_CREDENTIAL')
    await writeFile(path.join(source, 'index.ts'), 'export const ok = true\n')
    const destination = path.join(root, 'generated')
    await cp(source, destination, {
      recursive: true,
      filter: (entry) =>
        shouldCopySafeScaffoldEntry(entry, SKIPPED, path.join(source, '.env.development')),
    })
    assert.equal(await readFile(path.join(destination, 'index.ts'), 'utf8'), 'export const ok = true\n')
    assert.equal(await readFile(path.join(destination, '.env.development'), 'utf8'), 'EXPO_PUBLIC_DEVTOOLS=true\n')
    await assert.rejects(readFile(path.join(destination, '.env.local'), 'utf8'), { code: 'ENOENT' })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
