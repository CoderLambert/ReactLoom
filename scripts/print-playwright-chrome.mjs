import { readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

const root = path.join(homedir(), '.cache', 'ms-playwright')

function walk(directory, found) {
  let entries
  try {
    entries = readdirSync(directory, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const next = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(next, found)
    else if (entry.name === 'chrome' && next.includes(`${path.sep}chrome-linux`)) found.push(next)
  }
}

const found = []
walk(root, found)
const chrome = found.sort()[0]
if (!chrome) {
  process.stderr.write(`No Playwright Chromium binary under ${root}\n`)
  process.exit(1)
}
process.stdout.write(chrome)
