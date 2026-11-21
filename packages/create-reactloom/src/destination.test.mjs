import assert from 'node:assert/strict'
import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, test } from 'node:test'
import { claimScaffoldDestination } from './destination.ts'

const roots = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'reactloom-destination-'))
  roots.push(root)
  return root
}

test('concurrent claims admit only one scaffold writer', async () => {
  const root = await fixture()
  const target = path.join(root, 'project')
  const claims = await Promise.allSettled(
    Array.from({ length: 12 }, () => claimScaffoldDestination(target)),
  )
  assert.equal(claims.filter((result) => result.status === 'fulfilled').length, 1)
  for (const result of claims) {
    if (result.status === 'rejected') {
      assert.match(result.reason.message, /Destination already exists/)
    }
  }
})

test('refuses an existing nonempty project without changing its files', async () => {
  const root = await fixture()
  const target = path.join(root, 'project')
  await mkdir(target)
  await writeFile(path.join(target, 'sentinel.txt'), 'keep me')
  await assert.rejects(claimScaffoldDestination(target), /Destination already exists/)
  assert.equal(await readFile(path.join(target, 'sentinel.txt'), 'utf8'), 'keep me')
})

test('refuses an existing file as a destination', async () => {
  const root = await fixture()
  const target = path.join(root, 'project')
  await writeFile(target, 'untouched')
  await assert.rejects(claimScaffoldDestination(target), /Destination already exists/)
  assert.equal(await readFile(target, 'utf8'), 'untouched')
})

test(
  'refuses an existing symlink as a destination',
  { skip: process.platform === 'win32' },
  async () => {
    const root = await fixture()
    const external = path.join(root, 'external')
    const target = path.join(root, 'project')
    await mkdir(external)
    await symlink(external, target, 'dir')
    await assert.rejects(claimScaffoldDestination(target), /Destination already exists/)
  },
)

test('recursive copy still works after an exclusive destination claim', async () => {
  const root = await fixture()
  const source = path.join(root, 'template')
  const target = path.join(root, 'project')
  await mkdir(source)
  await writeFile(path.join(source, 'entry.txt'), 'copied')
  await claimScaffoldDestination(target)
  await cp(source, target, { recursive: true })
  assert.equal(await readFile(path.join(target, 'entry.txt'), 'utf8'), 'copied')
})
