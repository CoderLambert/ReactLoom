#!/usr/bin/env node
// Opens file:line from a dev-server inspector. An explicit editor override wins;
// otherwise VS Code is the default. Inspectors spawn scripts/code so they keep
// the line number. That shim is not VS Code.

import { execFileSync, spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const GUI_EDITORS = [
  ['cursor', 'Cursor'],
  ['code', 'Code'],
  ['code-insiders', 'Code - Insiders'],
  ['codium', 'vscodium', 'VSCodium'],
]

const JETBRAINS = new Set([
  'webstorm',
  'idea',
  'pycharm',
  'phpstorm',
  'goland',
  'rider',
  'clion',
  'rubymine',
])

const COLON_EDITORS = new Set(['atom', 'subl', 'sublime', 'sublime_text', 'zed'])

const TERMINALS = [
  ['kitty', (args) => args],
  ['alacritty', (args) => ['-e', ...args]],
  ['wezterm', (args) => ['start', '--', ...args]],
  ['gnome-terminal', (args) => ['--', ...args]],
  ['konsole', (args) => ['-e', ...args]],
  ['xfce4-terminal', (args) => ['-e', ...args]],
  ['xterm', (args) => ['-e', ...args]],
]

export function parseLocation(argv) {
  const args = argv.filter(
    (arg) => arg !== '-g' && arg !== '-r' && arg !== '-n' && arg !== '-a' && arg !== '',
  )
  let lineFlag
  let columnFlag
  const positional = []
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--line' && args[index + 1]) {
      index += 1
      lineFlag = Number(args[index])
      continue
    }
    if (arg === '--column' && args[index + 1]) {
      index += 1
      columnFlag = Number(args[index])
      continue
    }
    const cursorCall = /^\+call cursor\((\d+),\s*(\d+)\)$/.exec(arg)
    if (cursorCall) {
      lineFlag = Number(cursorCall[1])
      columnFlag = Number(cursorCall[2])
      continue
    }
    const plus = /^\+(\d+)$/.exec(arg)
    if (plus) {
      lineFlag = Number(plus[1])
      continue
    }
    positional.push(arg)
  }

  for (let index = positional.length - 1; index >= 0; index -= 1) {
    const parsed = splitFileLine(positional[index])
    if (!parsed) continue
    return {
      file: parsed.file,
      line: positive(lineFlag ?? parsed.line),
      column: positive(columnFlag ?? parsed.column),
    }
  }

  const file = positional.find((arg) => !/^\d+$/.test(arg))
  if (!file) return null
  const numbers = positional.filter((arg) => /^\d+$/.test(arg)).map(Number)
  return {
    file,
    line: positive(lineFlag ?? numbers[0]),
    column: positive(columnFlag ?? numbers[1]),
  }
}

export function claimEditorEnv(launcherPath, env = process.env) {
  const explicit = ['LAUNCH_EDITOR', 'CODE_EDITOR', 'REACT_EDITOR']
    .map((key) => env[key])
    .find((value) => value && !samePath(value, launcherPath))
  if (explicit && !env.REACTLOOM_EDITOR) env.REACTLOOM_EDITOR = explicit
  env.LAUNCH_EDITOR = launcherPath
  env.CODE_EDITOR = launcherPath
  env.REACT_EDITOR = launcherPath
}

export function activateLauncher(configDir, env = process.env) {
  const root = launcherRoot(configDir)
  const modulePath = path.join(root, 'scripts', 'open-in-editor.mjs')
  const command = path.join(root, 'scripts', process.platform === 'win32' ? 'code.cmd' : 'code')
  if (!fs.existsSync(modulePath) || !fs.existsSync(command)) {
    throw new Error(`Click-to-source launcher is missing (${modulePath}).`)
  }
  claimEditorEnv(command, env)
  return command
}

export function planLaunch(location, context = {}) {
  const env = context.env ?? process.env
  const cwd = context.cwd ?? process.cwd()
  const platform = context.platform ?? process.platform
  const which = context.which ?? whichCommand
  const isSocket = context.isSocket ?? isSocketPath
  const processes = context.processes ?? listRunningEditors()
  const gitRoot = context.gitRoot ?? findGitRoot(cwd)
  const launcherPath = context.launcherPath
  const file = location.file
  const line = positive(location.line)
  const column = positive(location.column)

  const explicit = explicitEditor(env, launcherPath, which, [
    'REACTLOOM_EDITOR',
    'LAUNCH_EDITOR',
    'CODE_EDITOR',
    'REACT_EDITOR',
  ])
  if (explicit) {
    if (isNvimCommand(explicit)) {
      const nvim = planNvim({
        file,
        line,
        column,
        cwd,
        gitRoot,
        env,
        isSocket,
        which,
        platform,
        terminal: true,
        nvimBin: path.isAbsolute(explicit) ? explicit : undefined,
      })
      if (nvim) return nvim
      return { ok: false, reason: failureReason() }
    }
    return planExplicit(explicit, file, line, column)
  }

  const vscode = which('code')
  if (vscode && !samePath(vscode, launcherPath)) {
    return {
      ok: true,
      command: vscode,
      args: ['-r', '-g', `${file}:${line}:${column}`],
      wait: false,
    }
  }

  const ambient = explicitEditor(env, launcherPath, which, ['VISUAL', 'EDITOR'])
  if (ambient) {
    if (isNvimCommand(ambient)) {
      const nvim = planNvim({
        file,
        line,
        column,
        cwd,
        gitRoot,
        env,
        isSocket,
        which,
        platform,
        terminal: true,
        nvimBin: path.isAbsolute(ambient) ? ambient : undefined,
      })
      if (nvim) return nvim
      return { ok: false, reason: failureReason() }
    }
    return planExplicit(ambient, file, line, column)
  }

  const server = planNvim({
    file,
    line,
    column,
    cwd,
    gitRoot,
    env,
    isSocket,
    which,
    platform,
    terminal: false,
  })
  if (server) return server

  const gui = planGui(processes, launcherPath, file, line, column)
  if (gui) return gui

  const terminal = planNvim({
    file,
    line,
    column,
    cwd,
    gitRoot,
    env,
    isSocket,
    which,
    platform,
    terminal: true,
    socket: false,
  })
  if (terminal) return terminal

  return { ok: false, reason: failureReason() }
}

export function planEditorFocus(plan, context = {}) {
  const env = context.env ?? process.env
  const which = context.which ?? whichCommand
  if (editorBasename(plan.command) !== 'code') return null
  const hyprctl = which('hyprctl')
  if (!hyprctl) return null
  let instance = env.HYPRLAND_INSTANCE_SIGNATURE
  if (!instance) {
    try {
      const output = (context.execFileSync ?? execFileSync)(hyprctl, ['instances', '-j'], {
        encoding: 'utf8',
      })
      const instances = JSON.parse(output)
      instance = instances.sort((left, right) => right.time - left.time)[0]?.instance
    } catch {
      return null
    }
  }
  if (!instance) return null
  return {
    command: hyprctl,
    args: [
      '--instance',
      instance,
      'dispatch',
      'hl.dsp.focus({ window = "class:com.microsoft.VSCode" })',
    ],
  }
}

export function runCli(argv, context = {}) {
  const location = parseLocation(argv)
  if (!location) {
    console.error('Usage: open-in-editor.mjs <file:line:column>')
    process.exitCode = 1
    return
  }
  const plan = planLaunch(location, context)
  if (!plan.ok) {
    console.error(plan.reason)
    process.exitCode = 1
    return
  }
  if (plan.wait) {
    const result = (context.spawnSync ?? spawnSync)(plan.command, plan.args, { stdio: 'inherit' })
    process.exitCode = result.status ?? 1
    return
  }
  const spawnImpl = context.spawn ?? spawn
  const child = spawnImpl(plan.command, plan.args, { detached: true, stdio: 'ignore' })
  child.on('error', (error) => {
    console.error(error.message)
  })
  const focus = planEditorFocus(plan, context)
  if (focus) {
    child.on('spawn', () => {
      const schedule = context.setTimeout ?? setTimeout
      schedule(() => {
        const focusChild = spawnImpl(focus.command, focus.args, {
          detached: true,
          stdio: 'ignore',
        })
        focusChild.on('error', () => {})
        focusChild.unref()
      }, context.focusDelay ?? 350)
    })
  }
  child.unref()
}

export function failureReason() {
  return [
    'Could not open the file in an editor.',
    'Neovim: no listening server. One-time setup: nvim --listen .nvim.sock',
    'Or in init.lua: vim.fn.serverstart(vim.fn.getcwd() .. "/.nvim.sock")',
    'A stale socket: rm -f .nvim.sock and start nvim again.',
    'VS Code or Cursor: start the editor, or set LAUNCH_EDITOR=cursor',
    'A new nvim window needs nvim on PATH and a terminal emulator (or TERMINAL). The dev server has no TTY.',
  ].join('\n')
}

function launcherRoot(configDir) {
  const beside = path.join(configDir, 'scripts', 'open-in-editor.mjs')
  if (fs.existsSync(beside)) return configDir
  return path.resolve(configDir, '..', '..')
}

function explicitEditor(
  env,
  launcherPath,
  which,
  keys = ['REACTLOOM_EDITOR', 'LAUNCH_EDITOR', 'CODE_EDITOR', 'REACT_EDITOR'],
) {
  for (const key of keys) {
    const value = env[key]
    if (!value || samePath(value, launcherPath)) continue
    if (!path.isAbsolute(value)) {
      const resolved = which(value)
      if (resolved && samePath(resolved, launcherPath)) continue
    }
    return value
  }
  return undefined
}

function planExplicit(command, file, line, column) {
  const base = editorBasename(command)
  const location = `${file}:${line}:${column}`
  if (GUI_EDITORS.some((names) => names.some((name) => name.toLowerCase() === base))) {
    return { ok: true, command, args: ['-g', location], wait: false }
  }
  if (JETBRAINS.has(base)) {
    return {
      ok: true,
      command,
      args: ['--line', String(line), '--column', String(column), file],
      wait: false,
    }
  }
  if (COLON_EDITORS.has(base)) return { ok: true, command, args: [location], wait: false }
  return { ok: true, command, args: [location], wait: false }
}

function planNvim({
  file,
  line,
  column,
  cwd,
  gitRoot,
  env,
  isSocket,
  which,
  platform,
  terminal,
  socket = true,
  nvimBin,
}) {
  const nvim = nvimBin ?? which('nvim')
  if (!nvim) return undefined
  if (socket) {
    const address = findNvimAddress({ env, cwd, gitRoot, isSocket })
    if (address) {
      return {
        ok: true,
        command: nvim,
        args: [
          '--server',
          address,
          '--remote-expr',
          `execute('edit ' . fnameescape(${vimStringLiteral(file)})) . cursor(${line}, ${column})`,
        ],
        wait: true,
      }
    }
  }
  if (!terminal) return undefined
  return planTerminal(which, env, platform, [nvim, `+${line}`, file])
}

function planTerminal(which, env, platform, nvimArgs) {
  if (platform === 'darwin') {
    const osascript = which('osascript')
    if (!osascript) return undefined
    const command = `${nvimArgs[0]} +${argLine(nvimArgs)} ${shQuote(nvimArgs[2])}`
    return {
      ok: true,
      command: osascript,
      args: ['-e', `tell application "Terminal" to do script ${appleQuote(command)}`],
      wait: false,
    }
  }
  if (platform === 'win32') {
    const wt = which('wt') ?? which('wt.exe')
    if (!wt) return undefined
    return {
      ok: true,
      command: wt,
      args: ['nvim', `+${argLine(nvimArgs)}`, nvimArgs[2]],
      wait: false,
    }
  }
  const preferred = env.TERMINAL ? [env.TERMINAL] : []
  const names = [...preferred, ...TERMINALS.map(([name]) => name)]
  for (const name of names) {
    const bin = which(name) ?? (path.isAbsolute(name) && fs.existsSync(name) ? name : null)
    if (!bin) continue
    const base = path.basename(bin)
    const known = TERMINALS.find(([terminal]) => terminal === base || terminal === name)
    const args = known ? known[1](nvimArgs) : nvimArgs
    return { ok: true, command: bin, args, wait: false }
  }
  return undefined
}

function planGui(processes, launcherPath, file, line, column) {
  for (const names of GUI_EDITORS) {
    const match = processes.find((proc) => {
      if (proc.exe && samePath(proc.exe, launcherPath)) return false
      const comm = proc.comm ?? ''
      const exeBase = proc.exe ? path.basename(proc.exe) : ''
      return names.some((name) => comm === name || path.basename(comm) === name || exeBase === name)
    })
    if (!match) continue
    const command = match.exe || match.comm
    return {
      ok: true,
      command,
      args: ['-r', '-g', `${file}:${line}:${column}`],
      wait: false,
    }
  }
  return undefined
}

function findNvimAddress({ env, cwd, gitRoot, isSocket }) {
  const candidates = [env.NVIM, env.NVIM_LISTEN_ADDRESS].filter(Boolean)
  let dir = cwd
  const stop = gitRoot || cwd
  while (dir) {
    candidates.push(path.join(dir, '.nvim.sock'))
    if (dir === stop || path.dirname(dir) === dir) break
    dir = path.dirname(dir)
  }
  return candidates.find((address) => isListenAddress(address, isSocket))
}

function isListenAddress(address, isSocket) {
  if (!address) return false
  if (address.startsWith('\\\\.\\pipe\\') || address.startsWith('//./pipe/')) return true
  if (/^[^/\\]+:\d+$/.test(address)) return true
  return isSocket(address)
}

function isNvimCommand(command) {
  const base = editorBasename(command)
  return base === 'nvim' || base === 'neovim' || base === 'vim'
}

function editorBasename(command) {
  return path
    .basename(command)
    .replace(/\.(exe|cmd|bat)$/i, '')
    .toLowerCase()
}

function splitFileLine(token) {
  const withColumn = /^(.*):(\d+):(\d+)$/.exec(token)
  if (withColumn?.[1])
    return { file: withColumn[1], line: Number(withColumn[2]), column: Number(withColumn[3]) }
  const lineOnly = /^(.*):(\d+)$/.exec(token)
  if (lineOnly?.[1] && !/^[A-Za-z]$/.test(lineOnly[1])) {
    return { file: lineOnly[1], line: Number(lineOnly[2]), column: 1 }
  }
  return null
}

function positive(value) {
  return Number.isInteger(value) && value > 0 ? value : 1
}

function samePath(left, right) {
  if (!left || !right) return false
  return path.resolve(left) === path.resolve(right)
}

function argLine(nvimArgs) {
  return nvimArgs[1].slice(1)
}

function shQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`
}

function appleQuote(value) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

function vimStringLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`
}

function whichCommand(command) {
  const finder = process.platform === 'win32' ? 'where.exe' : 'which'
  try {
    return execFileSync(finder, [command], { encoding: 'utf8' }).split(/\r?\n/)[0]?.trim() || null
  } catch {
    return null
  }
}

function isSocketPath(filePath) {
  try {
    return fs.statSync(filePath).isSocket()
  } catch {
    return false
  }
}

export function listRunningEditors() {
  try {
    if (process.platform === 'linux') return readPs(['-eo', 'pid=,comm='], true)
    if (process.platform === 'darwin') return readPs(['x', '-o', 'pid=,comm='], false)
    if (process.platform === 'win32') {
      const output = execFileSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-Command',
          'Get-CimInstance Win32_Process | Select-Object -ExpandProperty ExecutablePath',
        ],
        { encoding: 'utf8' },
      )
      return output
        .split(/\r?\n/)
        .map((exe) => exe.trim())
        .filter(Boolean)
        .map((exe) => ({ comm: path.basename(exe), exe }))
    }
  } catch {
    return []
  }
  return []
}

function readPs(args, useProcExe) {
  const output = execFileSync('ps', args, { encoding: 'utf8' })
  const editors = []
  for (const line of output.split('\n')) {
    const match = /^\s*(\d+)\s+(.+)$/.exec(line)
    if (!match) continue
    const comm = match[2].trim()
    let exe = comm
    if (useProcExe) {
      try {
        exe = fs.readlinkSync(`/proc/${match[1]}/exe`)
      } catch {
        exe = comm
      }
    }
    editors.push({ comm, exe })
  }
  return editors
}

function findGitRoot(cwd) {
  try {
    return execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return cwd
  }
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (invokedDirectly) runCli(process.argv.slice(2))
