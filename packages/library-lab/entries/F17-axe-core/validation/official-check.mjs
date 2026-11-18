import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const entry = new URL('../', import.meta.url)
const ref = 'e797173108eadfa4355fe06af331791734e1757f'
for (const [remote, local] of [
  ['README.md', 'readme.md'],
  ['LICENSE', 'license.txt'],
  ['package.json', 'package.json'],
]) {
  const response = await fetch(
    `https://raw.githubusercontent.com/dequelabs/axe-core/${ref}/${remote}`,
  )
  assert.equal(response.status, 200)
  assert.deepEqual(
    Buffer.from(await response.arrayBuffer()),
    await readFile(new URL(`official/${local}`, entry)),
  )
  console.log('MATCH', remote)
}
const require = createRequire(new URL('../../package.json', entry))
const p = require('axe-core/package.json')
assert.equal(p.version, '4.14.0')
assert.equal(p.license, 'MPL-2.0')
console.log(p.name, p.version, p.license)
const source = await readFile(require.resolve('axe-core/axe.js'), 'utf8')
const start = source.indexOf("id: 'label',\n      impact:")
const label = source.slice(start, source.indexOf("id: 'landmark-banner-is-top-level'", start))
assert.match(label, /non-empty-placeholder/)
console.log('Installed label rule any contains non-empty-placeholder')
