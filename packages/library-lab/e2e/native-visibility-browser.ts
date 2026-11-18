import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Page } from '@playwright/test'

/** A disposable browser, no user profile. Playwright's normal per-page focus
 * emulation suppresses native visibility; noDefaults avoids enabling it at all.
 * No document property/event is forged, and the owned process always closes. */
export async function withNativeVisibilityBrowser(run: (page: Page) => Promise<void>) {
  const profile = await mkdtemp(join(tmpdir(), 'reactloom-native-visibility-'))
  const child = spawn(
    chromium.executablePath(),
    [
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--no-sandbox',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )
  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined
  try {
    let port = ''
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(`Own Chromium exited ${child.exitCode}`)
      try {
        port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]
        break
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }
    if (!port) throw new Error('Own temporary Chromium did not expose its debugging port')
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { noDefaults: true })
    await run(browser.contexts()[0].pages()[0])
  } finally {
    if (browser) await browser.close()
    child.kill('SIGTERM')
    if (child.exitCode === null)
      await Promise.race([
        new Promise((resolve) => child.once('exit', resolve)),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ])
    if (child.exitCode === null) child.kill('SIGKILL')
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}
