import { spawn } from 'node:child_process'
import { request } from 'node:http'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const forwarded = forwardedArgs(process.argv)
const port = flagValue(forwarded, '--port') ?? '4318'
const url = `http://127.0.0.1:${port}`
const shouldOpen = shouldOpenBrowser(process.env)

const nextBin = require.resolve('next/dist/bin/next')
const nextArgs = forwarded[0] === 'next' ? forwarded.slice(1) : forwarded
const child = spawn(process.execPath, [nextBin, ...nextArgs], { stdio: 'inherit' })

let opened = false
if (shouldOpen) poll()

function poll() {
  if (opened || child.exitCode !== null) return
  const req = request(url, (response) => {
    response.resume()
    if (opened) return
    opened = true
    openBrowser(url)
  })
  req.setTimeout(1000, () => req.destroy())
  req.on('error', () => {
    setTimeout(poll, 300)
  })
  req.end()
}

function openBrowser(target) {
  const platform = process.platform
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open'
  const args = platform === 'win32' ? ['/c', 'start', '', target] : [target]
  const opener = spawn(command, args, { stdio: 'ignore', detached: true })
  opener.on('error', () => undefined)
  opener.unref()
}

function forwardedArgs(argv) {
  const separator = argv.indexOf('--')
  if (separator === -1) return ['next', 'dev', '--hostname', '0.0.0.0', '--port', '4318']
  return argv.slice(separator + 1)
}

function flagValue(args, name) {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  return args[index + 1]
}

export function shouldOpenBrowser(env) {
  if (env.CI) return false
  if (env.REACTLOOM_OPEN === 'false') return false
  return true
}

function stop(signal) {
  if (!child.killed) child.kill(signal)
}

process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))
child.on('exit', (code) => {
  process.exit(code ?? 0)
})
