import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const root = new URL('../', import.meta.url)
const ref = 'f7c7afdb0dfc1b928d0f18b19a5d4287bddff9d5'
for (const [up, local] of [
  ['packages/orval/README.md', 'readme.md'],
  ['LICENSE', 'license.txt'],
  ['packages/orval/package.json', 'package.json'],
]) {
  const response = await fetch(`https://raw.githubusercontent.com/orval-labs/orval/${ref}/${up}`)
  assert.equal(response.status, 200)
  assert.deepEqual(
    Buffer.from(await response.arrayBuffer()),
    await readFile(new URL('official/' + local, root)),
  )
  console.log('MATCH', up)
}
const require = createRequire(new URL('../../package.json', root))
const installed = require('orval/package.json')
assert.equal(installed.version, '8.44.0')
assert.equal(installed.license, 'MIT')
console.log('installed', installed.version, installed.license)
