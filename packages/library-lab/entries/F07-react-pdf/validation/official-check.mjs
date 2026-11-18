import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const root = new URL('../', import.meta.url)
const meta = JSON.parse(await readFile(new URL('library.json', root), 'utf8'))
const source = meta.official.readme
const remote = Buffer.from(
  await (
    await fetch(
      `https://raw.githubusercontent.com/${source.repository}/${source.commit}/${source.path}`,
    )
  ).arrayBuffer(),
)
assert.deepEqual(remote, await readFile(new URL('official/readme.md', root)))
assert.equal(createHash('sha256').update(remote).digest('hex'), source.sha256)
const license = Buffer.from(
  await (
    await fetch(`https://raw.githubusercontent.com/${source.repository}/${source.commit}/LICENSE`)
  ).arrayBuffer(),
)
assert.deepEqual(license, await readFile(new URL('official/license.txt', root)))
const require = createRequire(new URL('../../package.json', root))
for (const [name, version, licenseName] of [
  ['react-pdf', '11.0.0', 'MIT'],
  ['pdfjs-dist', '6.3.289', 'Apache-2.0'],
]) {
  const pkg = require(`${name}/package.json`)
  assert.equal(pkg.version, version)
  assert.equal(pkg.license, licenseName)
  console.log(name, version, licenseName)
}
console.log('Fixed README and LICENSE original bytes match; sha256', source.sha256)
