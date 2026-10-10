import { spawn } from 'node:child_process'

const args = process.argv.slice(2)
const separator = args.indexOf('--')
const mode = separator === -1 ? args[0] : args[0]
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

if (local) {
  if (!url) {
    process.stderr.write(
      'LIGHTHOUSE_LOCAL is set, but the command has no --port and LIGHTHOUSE_URL is empty.\n',
    )
  } else {
    audit(url, mode).catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      process.stderr.write(`${message}\n`)
    })
  }
}

child.on('exit', (code, signal) => {
  process.off('SIGINT', stop)
  process.off('SIGTERM', stop)
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 1)
})

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

async function waitForUrl(target) {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(target, { redirect: 'manual' })
      if (response.status < 500) return
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timed out waiting for ${target}`)
}
