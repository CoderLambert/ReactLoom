import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const distAssets = path.resolve('dist/assets')
const budgets = {
  totalJsGzip: 550 * 1024,
  largestJsGzip: 280 * 1024,
}

const files = await readdir(distAssets)
const jsFiles = files.filter((file) => file.endsWith('.js'))
if (jsFiles.length === 0) {
  console.error('No JavaScript assets were emitted.')
  process.exit(1)
}

let total = 0
let largest = { name: '', size: 0 }
const rows = []

for (const file of jsFiles) {
  const fullPath = path.join(distAssets, file)
  const info = await stat(fullPath)
  const gzip = gzipSync(await readFile(fullPath)).length
  total += gzip
  rows.push({ file, raw: info.size, gzip })
  if (gzip > largest.size) largest = { name: file, size: gzip }
}

rows.sort((a, b) => b.gzip - a.gzip)
for (const row of rows) {
  console.log(`${row.file}  raw ${format(row.raw)}  gzip ${format(row.gzip)}`)
}
console.log(`total js gzip ${format(total)} (budget ${format(budgets.totalJsGzip)})`)
console.log(`largest js gzip ${format(largest.size)} (budget ${format(budgets.largestJsGzip)})`)

const failures = []
if (total > budgets.totalJsGzip) failures.push('total JavaScript gzip budget exceeded')
if (largest.size > budgets.largestJsGzip)
  failures.push(`largest chunk ${largest.name} exceeded its gzip budget`)

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

function format(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}
