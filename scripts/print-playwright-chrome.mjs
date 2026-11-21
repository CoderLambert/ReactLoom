import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve from the package that owns Playwright, not from a shared browser cache.
// pnpm may install a different Playwright revision for each template.
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const template = process.argv[2]
if (template !== undefined && template !== 'spa' && template !== 'ssr') {
  process.stderr.write('Expected a template name: spa or ssr.\n')
  process.exit(1)
}
const projectRoot = template ? join(root, 'templates', template) : root

try {
  const require = createRequire(join(projectRoot, 'package.json'))
  const { chromium } = require('@playwright/test')
  const executable = chromium.executablePath()
  if (!existsSync(executable)) {
    throw new Error(
      'Playwright Chromium is not installed at ' +
        executable +
        '. Run playwright install chromium.',
    )
  }
  process.stdout.write(executable)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  const projectName = template ?? 'standalone project'
  process.stderr.write(
    'Cannot resolve Playwright Chromium for ' + projectName + ': ' + message + '\n',
  )
  process.exitCode = 1
}
