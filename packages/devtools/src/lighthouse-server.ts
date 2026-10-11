import { spawn } from 'node:child_process'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import type { LighthouseReport, LighthouseState } from './lighthouse-types.js'

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function string(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function summarizeLighthouse(value: unknown): LighthouseReport | null {
  const report = record(value)
  if (!report.categories || !report.audits || !report.fetchTime) return null
  const audits = record(report.audits)
  return {
    url: string(report.finalDisplayedUrl) || string(report.finalUrl) || string(report.requestedUrl),
    fetchedAt: string(report.fetchTime),
    categories: Object.entries(record(report.categories)).map(([id, value]) => {
      const category = record(value)
      return {
        id,
        title: string(category.title),
        score: typeof category.score === 'number' ? category.score : null,
      }
    }),
    metrics: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'total-blocking-time',
      'cumulative-layout-shift',
      'speed-index',
    ]
      .map((id) => record(audits[id]))
      .filter((audit) => audit.displayValue)
      .map((audit) => ({ title: string(audit.title), value: string(audit.displayValue) })),
    audits: Object.values(audits)
      .map(record)
      .filter((audit) => typeof audit.score === 'number' && audit.score < 1)
      .slice(0, 20)
      .map((audit) => ({ title: string(audit.title), value: string(audit.displayValue) })),
  }
}

// A browser can only read this local summary and launch the fixed local audit.
// Never accept a command, filename, or audit URL from the request.
export function createLighthouseServer(root: string, url: string) {
  let running = false
  let error: string | null = null
  const directory = path.join(root, '.lighthouseci')

  async function latest() {
    let names: string[]
    try {
      names = await readdir(directory)
    } catch {
      return null
    }
    const candidates = await Promise.all(
      names
        .filter((name) => /^lhr-.*\.json$/.test(name))
        .map(async (name) => {
          const file = path.join(directory, name)
          try {
            const info = await stat(file)
            return { file, modified: info.mtimeMs, size: info.size }
          } catch {
            return null
          }
        }),
    )
    const files = candidates.filter((item) => item !== null)
    for (const item of files.sort((a, b) => b.modified - a.modified).slice(0, 20)) {
      if (item.size > 10_000_000) continue
      try {
        const report = summarizeLighthouse(JSON.parse(await readFile(item.file, 'utf8')) as unknown)
        if (report) return report
      } catch {
        /* A running collector may still be writing a file. */
      }
    }
    return null
  }

  return {
    async state(): Promise<LighthouseState> {
      return { running, error, report: await latest() }
    },
    run() {
      if (running) return
      running = true
      error = null
      let output = ''
      const child = spawn('pnpm', ['exec', 'lhci', 'collect'], {
        cwd: root,
        env: { ...process.env, CI: 'false', LIGHTHOUSE_ATTACH: '1', LIGHTHOUSE_URL: url },
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 180_000,
      })
      const append = (chunk: Buffer) => {
        output = (output + chunk.toString()).slice(-3000)
      }
      child.stdout.on('data', append)
      child.stderr.on('data', append)
      child.on('error', (cause) => {
        error = cause.message
        running = false
      })
      child.on('close', (code) => {
        if (code !== 0 && !error) error = output.trim() || `Lighthouse exited with code ${code}.`
        running = false
      })
    },
  }
}

export function isLocalDevtoolsRequest(host: string | null, origin: string | null): boolean {
  if (!host) return false
  try {
    const target = new URL(`http://${host}`)
    if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) return false
    return !origin || new URL(origin).origin === target.origin
  } catch {
    return false
  }
}
