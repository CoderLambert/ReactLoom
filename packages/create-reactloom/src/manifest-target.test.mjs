import assert from 'node:assert/strict'
import { cp, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, test } from 'node:test'
import { assertManifestCopyTargetAvailable, renameManifestFile } from './manifest-target.ts'

const roots = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'reactloom-manifest-target-'))
  roots.push(root)
  const repo = path.join(root, 'repo')
  const generated = path.join(root, 'generated')
  await mkdir(repo)
  await mkdir(generated)
  return { root, repo, generated }
}

test('rejects a manifest config that would overwrite staged template bytes', async () => {
  const { repo, generated } = await fixture()
  const relative = 'configs/tool.json'
  await mkdir(path.join(repo, 'configs'))
  await mkdir(path.join(generated, 'configs'))
  await writeFile(path.join(repo, relative), 'shared config')
  await writeFile(path.join(generated, relative), 'template config')

  await assert.rejects(
    assertManifestCopyTargetAvailable(generated, relative),
    /copy target already exists: configs\/tool\.json/,
  )
  assert.equal(await readFile(path.join(generated, relative), 'utf8'), 'template config')
})

test('rejects an adapted documentation target and preserves its original content', async () => {
  const { generated } = await fixture()
  const relative = 'docs/best-practices/README.md'
  await mkdir(path.dirname(path.join(generated, relative)), { recursive: true })
  await writeFile(path.join(generated, relative), 'template documentation')

  await assert.rejects(
    assertManifestCopyTargetAvailable(generated, relative),
    /copy target already exists: docs\/best-practices\/README\.md/,
  )
  assert.equal(await readFile(path.join(generated, relative), 'utf8'), 'template documentation')
})

test('rejects existing directories and symlinks as copy targets', async () => {
  const { root, generated } = await fixture()
  await mkdir(path.join(generated, 'existing'))
  await assert.rejects(
    assertManifestCopyTargetAvailable(generated, 'existing'),
    /copy target already exists: existing/,
  )
  if (process.platform === 'win32') return
  await writeFile(path.join(root, 'external.txt'), 'untouched')
  await symlink(path.join(root, 'external.txt'), path.join(generated, 'linked'))
  await assert.rejects(
    assertManifestCopyTargetAvailable(generated, 'linked'),
    /copy target already exists: linked/,
  )
  assert.equal(await readFile(path.join(root, 'external.txt'), 'utf8'), 'untouched')
})

test('allows a missing manifest destination and copies the selected source', async () => {
  const { repo, generated } = await fixture()
  const relative = 'configs/tool.json'
  await mkdir(path.join(repo, 'configs'))
  await writeFile(path.join(repo, relative), 'root config')
  await assertManifestCopyTargetAvailable(generated, relative)
  await mkdir(path.dirname(path.join(generated, relative)), { recursive: true })
  await cp(path.join(repo, relative), path.join(generated, relative))
  assert.equal(await readFile(path.join(generated, relative), 'utf8'), 'root config')
})

test('renames an SSR scaffold file when its destination is absent', async () => {
  const { generated } = await fixture()
  await writeFile(path.join(generated, 'Dockerfile.standalone'), 'standalone')
  await renameManifestFile(generated, 'Dockerfile.standalone', 'Dockerfile')
  assert.equal(await readFile(path.join(generated, 'Dockerfile'), 'utf8'), 'standalone')
  await assert.rejects(lstat(path.join(generated, 'Dockerfile.standalone')), { code: 'ENOENT' })
})

test('refuses to overwrite an existing Dockerfile during manifest rename', async () => {
  const { generated } = await fixture()
  await writeFile(path.join(generated, 'Dockerfile.standalone'), 'standalone')
  await writeFile(path.join(generated, 'Dockerfile'), 'template original')
  await assert.rejects(
    renameManifestFile(generated, 'Dockerfile.standalone', 'Dockerfile'),
    /rename target already exists: Dockerfile/,
  )
  assert.equal(await readFile(path.join(generated, 'Dockerfile'), 'utf8'), 'template original')
  assert.equal(await readFile(path.join(generated, 'Dockerfile.standalone'), 'utf8'), 'standalone')
})

test('refuses a manifest rename into an existing directory', async () => {
  const { generated } = await fixture()
  await writeFile(path.join(generated, 'Dockerfile.standalone'), 'standalone')
  await mkdir(path.join(generated, 'Dockerfile'))
  await assert.rejects(
    renameManifestFile(generated, 'Dockerfile.standalone', 'Dockerfile'),
    /rename target already exists: Dockerfile/,
  )
  assert.equal((await lstat(path.join(generated, 'Dockerfile'))).isDirectory(), true)
  assert.equal(await readFile(path.join(generated, 'Dockerfile.standalone'), 'utf8'), 'standalone')
})

test('refuses a manifest rename into an existing symlink', async () => {
  if (process.platform === 'win32') return
  const { root, generated } = await fixture()
  const outside = path.join(root, 'outside.txt')
  await writeFile(outside, 'external original')
  await writeFile(path.join(generated, 'Dockerfile.standalone'), 'standalone')
  await symlink(outside, path.join(generated, 'Dockerfile'))
  await assert.rejects(
    renameManifestFile(generated, 'Dockerfile.standalone', 'Dockerfile'),
    /rename target already exists: Dockerfile/,
  )
  assert.equal((await lstat(path.join(generated, 'Dockerfile'))).isSymbolicLink(), true)
  assert.equal(await readFile(outside, 'utf8'), 'external original')
  assert.equal(await readFile(path.join(generated, 'Dockerfile.standalone'), 'utf8'), 'standalone')
})
