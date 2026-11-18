import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { assertSafeSourcePath, copySafeSource } from './source-safety.js'

const created: string[] = []

async function fixture() {
  const directory = await mkdtemp(path.join(tmpdir(), 'reactloom-source-safety-'))
  created.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    created.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

describe('scaffold source confinement', () => {
  it('copies ordinary source files and skips generated dependency directories', async () => {
    const root = await fixture()
    const source = path.join(root, 'source')
    await mkdir(path.join(source, 'src'), { recursive: true })
    await mkdir(path.join(source, 'node_modules'))
    await writeFile(path.join(source, 'src', 'index.ts'), 'export const value = 1\n')
    await writeFile(path.join(source, 'node_modules', 'cached.js'), 'skip me')
    const destination = path.join(root, 'destination')

    await assertSafeSourcePath(root, 'source/src/index.ts')
    await copySafeSource(source, destination, new Set(['node_modules']))

    expect(await readFile(path.join(destination, 'src', 'index.ts'), 'utf8')).toContain('value')
    await expect(lstat(path.join(destination, 'node_modules'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  it('rejects a symlinked file in a copied template rather than emitting it', async () => {
    const root = await fixture()
    const source = path.join(root, 'source')
    await mkdir(source)
    const secret = path.join(root, 'secret.txt')
    await writeFile(secret, 'private')
    await symlink(secret, path.join(source, 'public.txt'))

    const destination = path.join(root, 'generated')
    await expect(copySafeSource(source, destination, new Set())).rejects.toThrow(/symlinks/)
    await expect(lstat(path.join(destination, 'public.txt'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  it('rejects a symlinked directory inside a recursively copied package', async () => {
    const root = await fixture()
    const source = path.join(root, 'source')
    await mkdir(source)
    const outside = path.join(root, 'outside')
    await mkdir(outside)
    await writeFile(path.join(outside, 'secret.txt'), 'private')
    await symlink(outside, path.join(source, 'nested'), 'dir')

    await expect(copySafeSource(source, path.join(root, 'generated'), new Set())).rejects.toThrow(
      /symlinks/,
    )
  })

  it('rejects source paths whose parent is a symlink, including adapted docs and AI rules', async () => {
    const root = await fixture()
    const outside = path.join(root, 'outside')
    await mkdir(outside)
    await writeFile(path.join(outside, 'secret.md'), 'private')
    await symlink(outside, path.join(root, 'docs'), 'dir')

    await expect(assertSafeSourcePath(root, 'docs/secret.md')).rejects.toThrow(/symlinks/)
    await expect(assertSafeSourcePath(root, 'docs')).rejects.toThrow(/symlinks/)
  })

  it('rejects filesystem paths that leave the repository even without a symlink', async () => {
    const root = await fixture()
    await expect(assertSafeSourcePath(root, '../private')).rejects.toThrow(/inside the repository/)
    await expect(assertSafeSourcePath(root, root)).rejects.toThrow(/inside the repository/)
  })
})
