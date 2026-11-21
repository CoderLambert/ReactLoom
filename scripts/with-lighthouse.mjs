import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'

function main() {
  const args = process.argv.slice(2)
  const separator = args.indexOf('--')
  const mode = args[0]
  const command = separator === -1 ? args.slice(1) : args.slice(separator + 1)

  if (!mode || command.length === 0) {
    process.stderr.write('usage: node scripts/with-lighthouse.mjs <dev|preview> -- <command...>\n')
    process.exit(1)
  }

  const portFlag = command.indexOf('--port')
  const port = portFlag === -1 ? undefined : command[portFlag + 1]
  const url = process.env.LIGHTHOUSE_URL || (port ? `http://127.0.0.1:${port}/` : undefined)
  const local = process.env.LIGHTHOUSE_LOCAL === 'true'

  const child = spawn(command[0], command.slice(1), { stdio: 'inherit' })

  function stop(signal) {
    if (!child.killed) child.kill(signal)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  function cleanup() {
    process.off('SIGINT', stop)
    process.off('SIGTERM', stop)
  }

  child.on('error', (cause) => {
    cleanup()
    process.stderr.write(`Failed to start preview command: ${cause.message}\n`)
    process.exitCode = 1
  })

  if (local) {
    if (!url) {
      process.stderr.write(
        'LIGHTHOUSE_LOCAL is set, but the command has no --port and LIGHTHOUSE_URL is empty.\n',
      )
    } else {
      // A missing preview executable emits 'error' without 'spawn'.
      // Do not begin a minute-long readiness probe for a process that never started.
      child.once('spawn', () => {
        audit(url, mode).catch((error) => {
          const message = error instanceof Error ? error.message : String(error)
          process.stderr.write(`${message}\n`)
        })
      })
    }
  }

  child.on('exit', (code, signal) => {
    cleanup()
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    process.exit(code ?? 1)
  })
}

async function audit(target, serverMode) {
  await waitForUrl(target)
  if (serverMode === 'dev') {
    process.stderr.write(
      'LIGHTHOUSE_LOCAL is auditing the dev server. Those scores are not the CI numbers. CI and `pnpm lighthouse` use the production preview.\n',
    )
  }
  const env = {
    ...process.env,
    LIGHTHOUSE_ATTACH: '1',
    LIGHTHOUSE_URL: target,
  }
  await run('pnpm', ['exec', 'lhci', 'collect'], env)
  await run('pnpm', ['exec', 'lhci', 'assert'], env)
}

function run(file, commandArgs, env) {
  return new Promise((resolve, reject) => {
    const audit = spawn(file, commandArgs, { stdio: 'inherit', env })
    audit.on('error', reject)
    audit.on('exit', (code) => {
      if (code === 0) resolve()
      else
        reject(new Error(`${file} ${commandArgs.join(' ')} exited with code ${code ?? 'unknown'}`))
    })
  })
}

// A server can accept a connection without ever sending HTTP headers. Keep
// each probe within the remaining deadline, not just the retry-loop clock.
export async function waitForUrl(target, { timeoutMs = 60_000, retryDelayMs = 500 } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const remainingMs = Math.max(1, deadline - Date.now())
    const probeSignal = AbortSignal.timeout(remainingMs)
    try {
      const response = await fetch(target, {
        redirect: 'manual',
        signal: probeSignal,
      })
      // A redirect or a non-2xx response is not evidence of readiness.
      const ready = response.ok
      if (ready) {
        // A successful status is already sufficient. A noncooperative body
        // cancel must not indefinitely hold a healthy preview's readiness.
        try {
          void response.body?.cancel().catch(() => undefined)
        } catch {
          // Body cleanup is best-effort after a successful status.
        }
        return
      }
      // Await stream cleanup before another probe to avoid leaking sockets,
      // but never await longer than this probe's remaining startup deadline.
      try {
        const cancellation = response.body?.cancel()
        if (cancellation) {
          await new Promise((resolve) => {
            let done = false
            const finish = () => {
              if (done) return
              done = true
              probeSignal.removeEventListener('abort', finish)
              resolve(undefined)
            }
            probeSignal.addEventListener('abort', finish, { once: true })
            void cancellation.then(finish, finish)
            if (probeSignal.aborted) finish()
          })
        }
      } catch {
        // A failed stream cleanup must not change the HTTP readiness result.
      }
    } catch {
      // The server is still starting or a stalled probe reached the deadline.
    }
    const delayMs = Math.min(retryDelayMs, Math.max(0, deadline - Date.now()))
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  throw new Error(`Timed out waiting for ${target}`)
}

// Importing the health-check in unit tests must not start a subprocess.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
