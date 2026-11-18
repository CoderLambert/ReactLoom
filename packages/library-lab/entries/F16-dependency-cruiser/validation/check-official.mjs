import crypto from 'node:crypto'
import fs from 'node:fs'
import { validateOfficialSources } from '../../../src/lib/official-sources.mjs'

const entry = 'packages/library-lab/entries/F16-dependency-cruiser/'
const data = JSON.parse(fs.readFileSync(`${entry}library.json`))
const errors = validateOfficialSources(data.official)
const readme = data.official.readme
for (const [remote, local] of [
  [readme.path, 'readme.md'],
  ['LICENSE', 'license.txt'],
]) {
  const url = `https://raw.githubusercontent.com/${readme.repository}/${readme.commit}/${remote}`
  const response = await fetch(url)
  if (!response.ok) throw Error(`HTTP ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer()),
    saved = fs.readFileSync(`${entry}official/${local}`)
  const hash = crypto.createHash('sha256').update(bytes).digest('hex')
  if (!bytes.equals(saved)) errors.push(`bytes differ ${local}`)
  if (local === 'readme.md' && hash !== readme.sha256) errors.push('metadata hash mismatch')
  console.log(
    JSON.stringify({
      url,
      status: response.status,
      bytes: bytes.length,
      sha256: hash,
      sameBytes: bytes.equals(saved),
    }),
  )
}
const pkg = JSON.parse(
  fs.readFileSync('packages/library-lab/node_modules/dependency-cruiser/package.json'),
)
console.log(
  JSON.stringify({ errors, version: pkg.version, license: pkg.license, browser: pkg.browser }),
)
if (errors.length) process.exit(1)
