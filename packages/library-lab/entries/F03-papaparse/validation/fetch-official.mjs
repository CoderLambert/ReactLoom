import crypto from 'node:crypto'
import fs from 'node:fs'

const base = 'packages/library-lab/entries/F03-papaparse/'
const ref = '555c1c1b6175e7a043adf8694983776a1e6fdeeb'
for (const [remote, local] of [
  ['README.md', 'readme.md'],
  ['LICENSE', 'license.txt'],
]) {
  const url = `https://raw.githubusercontent.com/mholt/PapaParse/${ref}/${remote}`
  const response = await fetch(url)
  if (!response.ok) throw Error(`${response.status} ${url}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const same = bytes.equals(fs.readFileSync(`${base}official/${local}`))
  console.log(
    JSON.stringify({
      url,
      status: response.status,
      bytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      sameBytes: same,
    }),
  )
  if (!same) throw Error('fixed bytes differ')
}
