import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const root = path.resolve('.next/static')
const budgets = { totalJsGzip: 900 * 1024 }

const files = await walk(root)
const jsFiles = files.filter((file) => file.endsWith('.js'))
if (jsFiles.length === 0) {
  console.error('No client JavaScript was emitted under .next/static.')
  process.exit(1)
}

let total = 0
for (const file of jsFiles) {
  total += gzipSync(await readFile(file)).length
}
console.log(
  `client js gzip ${(total / 1024).toFixed(1)} KiB (budget ${(budgets.totalJsGzip / 1024).toFixed(1)} KiB)`,
)
if (total > budgets.totalJsGzip) {
  console.error('Client JavaScript gzip budget exceeded.')
  process.exit(1)
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return walk(fullPath)
      const info = await stat(fullPath)
      return info.isFile() ? [fullPath] : []
    }),
  )
  return nested.flat()
}
