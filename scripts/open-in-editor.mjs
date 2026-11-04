#!/usr/bin/env node
// Opens file:line:column from a dev-server inspector, using VS Code by default,
// or diagnoses the editor selection with --doctor. Keep this file dependency-free:
// create-reactloom copies it into standalone projects.

import { execFileSync, spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const EXPLICIT_EDITOR_KEYS = ['LAUNCH_EDITOR', 'CODE_EDITOR', 'REACT_EDITOR']
const AMBIENT_EDITOR_KEYS = ['VISUAL', 'EDITOR']
const EDITOR_ENV_KEYS = [...EXPLICIT_EDITOR_KEYS, ...AMBIENT_EDITOR_KEYS, 'REACTLOOM_EDITOR_DEBUG']

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
const TERMINAL_EDITORS = new Set([
  'nvim',
  'neovim',
  'vim',
  'vi',
  'nano',
  'pico',
  'micro',
  'hx',
  'helix',
  'omarchy-launch-editor',
])

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
    (arg) =>
      arg !== '--doctor' &&
      arg !== '-g' &&
      arg !== '-r' &&
      arg !== '-n' &&
      arg !== '-a' &&
      arg !== '',
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

export function splitCommand(command) {
  const args = []
  let current = ''
  let quote
  let escaped = false
  let started = false

  for (const character of command.trim()) {
    if (escaped) {
      if (quote === '"' && !['"', '\\', '$', '`', '\n'].includes(character)) current += '\\'
      current += character
      escaped = false
      started = true
      continue
    }
    if (character === '\\' && quote !== "'") {
      escaped = true
      started = true
      continue
    }
    if (quote) {
      if (character === quote) quote = undefined
      else current += character
      started = true
      continue
    }
    if (character === "'" || character === '"') {
      quote = character
      started = true
      continue
    }
    if (/\s/.test(character)) {
      if (started) {
        args.push(current)
        current = ''
        started = false
      }
      continue
    }
    current += character
    started = true
  }

  if (escaped) current += '\\'
  if (quote) throw new Error(`编辑器命令有未闭合的${quote}引号`)
  if (started) args.push(current)
  return args
}

export function claimEditorEnv(launcherPath, env = process.env) {
  const explicit = EXPLICIT_EDITOR_KEYS.map((key) => env[key]).find(
    (value) => value && !commandPointsToLauncher(value, launcherPath),
  )
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
  loadEditorEnv(configDir, env)
  env.REACTLOOM_CONFIG_DIR = configDir
  claimEditorEnv(command, env)
  return command
}

export function planLaunch(location, context = {}) {
  const cwd = context.cwd ?? process.cwd()
  const configDir = context.configDir ?? context.env?.REACTLOOM_CONFIG_DIR ?? cwd
  const env = loadEditorEnv(configDir, { ...(context.env ?? process.env) }, context.readFile)
  const platform = context.platform ?? process.platform
  const which = context.which ?? whichCommand
  const exists = context.exists ?? fs.existsSync
  const isSocket = context.isSocket ?? isSocketPath
  const scanSockets = context.scanSockets ?? (() => scanRuntimeSockets(env))
  const spawnSyncImpl = context.spawnSync ?? spawnSync
  const hasTty = context.hasTty ?? Boolean(process.stdin.isTTY && process.stdout.isTTY)
  const launcherPath = context.launcherPath
  const file = path.resolve(cwd, location.file)
  const line = positive(location.line)
  const column = positive(location.column)
  const gitRoot = path.resolve(context.gitRoot ?? findGitRoot(path.dirname(file)))
  const attempts = []
  const debug = []
  let preferredNvim

  const explicit = selectEditorCommand(
    env.REACTLOOM_EDITOR ? ['REACTLOOM_EDITOR'] : EXPLICIT_EDITOR_KEYS,
    env,
    launcherPath,
    which,
    exists,
    debug,
  )
  if (explicit?.error) {
    attempts.push(`显式编辑器：${explicit.error}`)
  } else if (explicit) {
    if (isNvimCommand(explicit.command)) {
      preferredNvim = resolveNvim(explicit, which, exists)
      if (!preferredNvim) {
        attempts.push(`显式编辑器：找不到可用于远程连接的 nvim（配置为 ${explicit.raw}）`)
      } else {
        debug.push(`显式编辑器 ${explicit.key}=${explicit.raw} 进入 Neovim server 检测`)
      }
    } else {
      const resolved = resolveExecutable(explicit.command, which, exists)
      if (resolved) {
        return finishPlan(
          planExplicit({ ...explicit, command: resolved }, file, line, column),
          attempts,
          debug,
          `显式编辑器 ${explicit.key}`,
          gitRoot,
        )
      }
      attempts.push(`显式编辑器：${explicit.command} 不在 PATH 中或文件不存在`)
    }
  } else {
    attempts.push('显式编辑器：LAUNCH_EDITOR、CODE_EDITOR、REACT_EDITOR 均未配置')
  }

  const vscode = resolveExecutable('code', which, exists)
  if (vscode && !preferredNvim) {
    const desktopOpener =
      platform === 'linux' ? resolveExecutable('xdg-open', which, exists) : undefined
    return finishPlan(
      desktopOpener
        ? {
            ok: true,
            command: desktopOpener,
            args: [vscodeFileUrl(file, line, column)],
            wait: false,
          }
        : {
            ok: true,
            command: vscode,
            args: ['-r', '-g', `${file}:${line}:${column}`],
            wait: false,
          },
      attempts,
      debug,
      desktopOpener ? '默认 VS Code（桌面激活）' : '默认 VS Code',
      gitRoot,
    )
  }
  attempts.push('默认 VS Code：PATH 中找不到 code')

  const nvim = preferredNvim ?? resolveNvim({ command: 'nvim', args: [] }, which, exists)
  if (nvim) {
    const probe =
      context.probeNvim ??
      ((address) => probeNvimServer(nvim, address, spawnSyncImpl, context.probeTimeout ?? 1000))
    const server = findNvimServer({
      file,
      gitRoot,
      env,
      nvim,
      isSocket,
      probe,
      scanSockets,
      debug,
    })
    if (server) {
      const escaped = fnameescape(file)
      return finishPlan(
        {
          ok: true,
          command: nvim.command,
          args: [
            ...nvim.args,
            '--server',
            server.address,
            '--remote-send',
            `<C-\\><C-N>:drop ${escaped} | call cursor(${line}, ${column})<CR>`,
          ],
          wait: true,
        },
        attempts,
        debug,
        `Neovim server ${server.address}`,
        gitRoot,
      )
    }
    attempts.push('Neovim server：没有找到可连接且属于当前 git 项目的实例')
  } else {
    attempts.push('Neovim server：PATH 中找不到 nvim')
  }

  const ambient = selectEditorCommand(AMBIENT_EDITOR_KEYS, env, launcherPath, which, exists, debug)
  if (ambient?.error) {
    attempts.push(`VISUAL / EDITOR：${ambient.error}`)
  } else if (ambient) {
    const resolved = resolveExecutable(ambient.command, which, exists)
    if (!resolved) {
      attempts.push(`VISUAL / EDITOR：${ambient.command} 不在 PATH 中或文件不存在`)
    } else if (isTerminalEditor(ambient.command) && !hasTty) {
      attempts.push(`VISUAL / EDITOR：${ambient.raw} 是终端编辑器，但开发服务器没有 TTY`)
      debug.push(`跳过 ${ambient.key}=${ambient.raw}：没有 TTY`)
    } else {
      const plan = isNvimCommand(ambient.command)
        ? {
            ok: true,
            command: resolved,
            args: [...ambient.args, `+call cursor(${line}, ${column})`, file],
            wait: true,
          }
        : planExplicit({ ...ambient, command: resolved }, file, line, column)
      return finishPlan(plan, attempts, debug, ambient.key, gitRoot)
    }
  } else {
    attempts.push('VISUAL / EDITOR：均未配置')
  }

  const processes = context.processes ?? listRunningEditors()
  const gui = planGui(processes, launcherPath, file, line, column)
  if (gui) return finishPlan(gui, attempts, debug, '正在运行的 Cursor / VS Code', gitRoot)
  attempts.push('Cursor / VS Code：未发现正在运行的受支持进程')

  if (nvim && env.TMUX) {
    const tmux = resolveExecutable('tmux', which, exists)
    if (tmux) {
      return finishPlan(
        {
          ok: true,
          command: tmux,
          args: ['new-window', '-c', gitRoot, nvim.command, ...nvim.args, `+${line}`, file],
          wait: false,
        },
        attempts,
        debug,
        'tmux 新窗口',
        gitRoot,
      )
    }
    attempts.push('tmux 兜底：检测到 $TMUX，但 PATH 中找不到 tmux')
  } else if (!env.TMUX) {
    attempts.push('tmux 兜底：当前环境没有 $TMUX')
  }

  if (nvim) {
    const terminal = planTerminal(
      which,
      env,
      platform,
      [nvim.command, ...nvim.args, `+${line}`, file],
      exists,
    )
    if (terminal) return finishPlan(terminal, attempts, debug, '新终端 Neovim', gitRoot)
    attempts.push('新终端 Neovim：找不到可用的终端模拟器')
  } else {
    attempts.push('新终端 Neovim：PATH 中找不到 nvim')
  }

  return {
    ok: false,
    reason: failureReason(attempts),
    attempts,
    debug,
    gitRoot,
  }
}

export function runCli(argv, context = {}) {
  const doctor = argv.includes('--doctor')
  const cwd = context.cwd ?? process.cwd()
  const location =
    parseLocation(argv) ??
    (doctor ? { file: path.join(cwd, 'package.json'), line: 1, column: 1 } : null)
  if (!location) {
    console.error('用法：open-in-editor.mjs [--doctor] <文件:行:列>')
    process.exitCode = 1
    return
  }

  const plan = planLaunch(location, context)
  const env = context.env ?? process.env
  if (doctor) {
    printDoctor(plan, location, context.log ?? console.log)
    if (!plan.ok) process.exitCode = 1
    return plan
  }
  if (env.REACTLOOM_EDITOR_DEBUG === '1') {
    for (const message of plan.debug ?? []) console.error(`[reactloom:editor] ${message}`)
  }
  if (!plan.ok) {
    console.error(plan.reason)
    process.exitCode = 1
    return plan
  }

  const spawnSyncImpl = context.spawnSync ?? spawnSync
  const spawnImpl = context.spawn ?? spawn
  if (plan.wait) {
    const result = spawnSyncImpl(plan.command, plan.args, { stdio: 'inherit' })
    if (result.error || result.status !== 0) {
      console.error(
        `编辑器启动失败：${result.error?.message ?? `${plan.command} 退出码 ${result.status}`}`,
      )
      process.exitCode = result.status ?? 1
    }
    return plan
  }
  const child = spawnImpl(plan.command, plan.args, { detached: true, stdio: 'ignore' })
  child.on('error', (error) => {
    console.error(`编辑器启动失败：${error.message}`)
    process.exitCode = 1
  })
  child.unref()
  return plan
}

export function failureReason(attempts = []) {
  const details = attempts.length > 0 ? attempts.map((item) => `- ${item}`).join('\n') : '- 未记录'
  return [
    'ReactLoom 无法把源码位置打开到编辑器。',
    '已尝试：',
    details,
    '配置建议：',
    '- 默认使用 VS Code；请确认 code 命令在 PATH 中。',
    '- 在模板目录的 .env.local 设置 LAUNCH_EDITOR（也支持 CODE_EDITOR / REACT_EDITOR），命令可以带引号参数。',
    '- 推荐让 Neovim 在每个项目的 git 根创建 .nvim.sock；也可以手动运行 nvim --listen .nvim.sock。',
    '- 探测失败不会自动删除 .nvim.sock；确认没有 Neovim 使用该路径后，可手动清理失效 socket。',
    '- init.lua：local root = vim.fs.root(0, ".git") or vim.fn.getcwd(); local sock = root .. "/.nvim.sock"; if not vim.uv.fs_stat(sock) then pcall(vim.fn.serverstart, sock) end',
    '- 设置 REACTLOOM_EDITOR_DEBUG=1 可查看 socket 和编辑器解析过程；pnpm doctor:editor [文件:行] 只诊断，不打开。',
  ].join('\n')
}

function printDoctor(plan, location, log) {
  log('ReactLoom 编辑器诊断（不会打开文件）')
  log(
    `目标：${path.resolve(location.file)}:${positive(location.line)}:${positive(location.column)}`,
  )
  log(`git 根目录：${plan.gitRoot}`)
  for (const attempt of plan.attempts ?? []) log(`尝试：${attempt}`)
  for (const message of plan.debug ?? []) log(`调试：${message}`)
  if (plan.ok) {
    log(`选择：${plan.method}`)
    log(`命令：${formatCommand(plan.command, plan.args)}`)
  } else {
    log(plan.reason)
  }
}

function finishPlan(plan, attempts, debug, method, gitRoot) {
  return { ...plan, attempts, debug, method, gitRoot }
}

function vscodeFileUrl(file, line, column) {
  const fileUrl = pathToFileURL(file).href
  return `vscode://file${fileUrl.slice('file://'.length)}:${line}:${column}`
}

function launcherRoot(configDir) {
  const beside = path.join(configDir, 'scripts', 'open-in-editor.mjs')
  if (fs.existsSync(beside)) return configDir
  return path.resolve(configDir, '..', '..')
}

function loadEditorEnv(configDir, env, readFile = fs.readFileSync) {
  const file = path.join(configDir, '.env.local')
  let source
  try {
    source = readFile(file, 'utf8')
  } catch {
    return env
  }
  for (const line of source.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
    if (!match || !EDITOR_ENV_KEYS.includes(match[1]) || env[match[1]] !== undefined) continue
    env[match[1]] = parseEnvValue(match[2])
  }
  return env
}

function parseEnvValue(value) {
  const trimmed = value.trim()
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed
      .slice(1, -1)
      .replaceAll('\\n', '\n')
      .replaceAll('\\"', '"')
      .replaceAll('\\\\', '\\')
  }
  return trimmed.replace(/\s+#.*$/, '').trim()
}

function selectEditorCommand(keys, env, launcherPath, which, exists, debug) {
  for (const key of keys) {
    const raw = env[key]
    if (!raw) continue
    let parts
    try {
      parts = splitCommand(raw)
    } catch (error) {
      return { error: `${key} 无法解析：${error.message}` }
    }
    if (parts.length === 0) continue
    const [command, ...args] = parts
    if (commandPointsToLauncher(command, launcherPath, which, exists)) {
      debug.push(`跳过 ${key}=${raw}：它指向 ReactLoom launcher 自己`)
      continue
    }
    debug.push(`解析 ${key}=${raw} -> ${JSON.stringify(parts)}`)
    return { key, raw, command, args }
  }
  return undefined
}

function planExplicit(editor, file, line, column) {
  const base = editorBasename(editor.command)
  const location = `${file}:${line}:${column}`
  if (GUI_EDITORS.some((names) => names.some((name) => name.toLowerCase() === base))) {
    return {
      ok: true,
      command: editor.command,
      args: [...editor.args, '-g', location],
      wait: false,
    }
  }
  if (JETBRAINS.has(base)) {
    return {
      ok: true,
      command: editor.command,
      args: [...editor.args, '--line', String(line), '--column', String(column), file],
      wait: false,
    }
  }
  if (COLON_EDITORS.has(base)) {
    return { ok: true, command: editor.command, args: [...editor.args, location], wait: false }
  }
  return {
    ok: true,
    command: editor.command,
    args: [...editor.args, location],
    wait: isTerminalEditor(editor.command),
  }
}

function resolveNvim(editor, which, exists) {
  const base = editorBasename(editor.command)
  const command =
    base === 'vim' || base === 'vi'
      ? resolveExecutable('nvim', which, exists)
      : resolveExecutable(editor.command, which, exists)
  return command ? { command, args: editor.args ?? [] } : undefined
}

function findNvimServer({ file, gitRoot, env, nvim, isSocket, probe, scanSockets, debug }) {
  for (const address of projectSocketCandidates(path.dirname(file), gitRoot)) {
    if (!isSocket(address)) {
      debug.push(`项目 socket 不存在或不是 socket：${address}`)
      continue
    }
    const result = normalizeProbe(probe(address, nvim))
    if (result.ok && pathInside(result.cwd, gitRoot)) {
      debug.push(`项目 socket 可用：${address}，cwd=${result.cwd}`)
      return { address, cwd: result.cwd }
    }
    if (result.ok) {
      debug.push(`跳过项目 socket ${address}：Neovim cwd=${result.cwd} 不在 ${gitRoot} 内`)
      continue
    }
    // A busy editor can time out even while its socket is still live.
    debug.push(`项目 socket 探测失败，保留路径：${address}（${result.reason}）`)
  }

  for (const [key, address] of [
    ['NVIM', env.NVIM],
    ['NVIM_LISTEN_ADDRESS', env.NVIM_LISTEN_ADDRESS],
  ]) {
    if (!address) continue
    if (!isSocket(address)) {
      debug.push(`跳过 $${key}=${address}：路径不存在或不是 socket`)
      continue
    }
    const result = normalizeProbe(probe(address, nvim))
    if (!result.ok) {
      debug.push(`跳过 $${key}=${address}：${result.reason}`)
      continue
    }
    if (!pathInside(result.cwd, gitRoot)) {
      debug.push(`跳过 $${key}=${address}：cwd=${result.cwd} 不属于当前项目`)
      continue
    }
    debug.push(`使用 $${key}=${address}，cwd=${result.cwd}`)
    return { address, cwd: result.cwd }
  }

  const matches = []
  for (const address of scanSockets()) {
    if (!isSocket(address)) {
      debug.push(`跳过运行时路径 ${address}：不是 socket`)
      continue
    }
    const result = normalizeProbe(probe(address, nvim))
    if (!result.ok) {
      debug.push(`跳过失效运行时 socket ${address}：${result.reason}`)
      continue
    }
    if (!pathInside(result.cwd, gitRoot)) {
      debug.push(`跳过其他项目的 Neovim ${address}：cwd=${result.cwd}`)
      continue
    }
    matches.push({ address, cwd: path.resolve(result.cwd) })
  }
  matches.sort((left, right) => pathDepth(right.cwd) - pathDepth(left.cwd))
  if (matches[0]) debug.push(`运行时 socket 匹配当前项目：${matches[0].address}`)
  return matches[0]
}

function normalizeProbe(result) {
  if (typeof result === 'string') return { ok: true, cwd: result.trim() }
  if (result?.ok) return { ok: true, cwd: String(result.cwd ?? '').trim() }
  return { ok: false, reason: result?.reason ?? '无法连接' }
}

function probeNvimServer(nvim, address, spawnSyncImpl, timeout) {
  const result = spawnSyncImpl(
    nvim.command,
    [...nvim.args, '--server', address, '--remote-expr', 'getcwd()'],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout,
    },
  )
  if (result.error) return { ok: false, reason: result.error.message }
  if (result.status !== 0) {
    return { ok: false, reason: String(result.stderr || `nvim 退出码 ${result.status}`).trim() }
  }
  const serverCwd = String(result.stdout ?? '').trim()
  return serverCwd ? { ok: true, cwd: serverCwd } : { ok: false, reason: 'getcwd() 没有返回路径' }
}

function projectSocketCandidates(start, gitRoot) {
  const candidates = []
  let directory = path.resolve(start)
  const root = path.resolve(gitRoot)
  if (!pathInside(directory, root)) directory = root
  while (pathInside(directory, root)) {
    candidates.push(path.join(directory, '.nvim.sock'))
    if (directory === root) break
    directory = path.dirname(directory)
  }
  return candidates
}

function scanRuntimeSockets(env) {
  const roots = env.XDG_RUNTIME_DIR
    ? [env.XDG_RUNTIME_DIR]
    : [`/run/user/${process.getuid?.() ?? os.userInfo().uid}`, os.tmpdir()]
  const sockets = []
  for (const root of [...new Set(roots)]) {
    let entries
    try {
      entries = fs.readdirSync(root, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (/^nvim\.\d+\.0$/.test(entry.name)) sockets.push(path.join(root, entry.name))
      if (entry.isDirectory() && /^nvim\..+/.test(entry.name)) {
        sockets.push(path.join(root, entry.name, '0'))
      }
    }
  }
  return [...new Set(sockets)]
}

function planTerminal(which, env, platform, nvimArgs, exists) {
  if (platform === 'darwin') {
    const osascript = resolveExecutable('osascript', which, exists)
    if (!osascript) return undefined
    const command = nvimArgs.map(shQuote).join(' ')
    return {
      ok: true,
      command: osascript,
      args: ['-e', `tell application "Terminal" to do script ${appleQuote(command)}`],
      wait: false,
    }
  }
  if (platform === 'win32') {
    const wt = resolveExecutable('wt', which, exists) ?? resolveExecutable('wt.exe', which, exists)
    if (!wt) return undefined
    return { ok: true, command: wt, args: nvimArgs, wait: false }
  }
  const preferred = env.TERMINAL ? [env.TERMINAL] : []
  const names = [...preferred, ...TERMINALS.map(([name]) => name)]
  for (const raw of names) {
    let parts
    try {
      parts = splitCommand(raw)
    } catch {
      continue
    }
    const [name, ...prefix] = parts
    const bin = resolveExecutable(name, which, exists)
    if (!bin) continue
    const base = path.basename(bin)
    const known = TERMINALS.find(([terminal]) => terminal === base || terminal === name)
    const args = known ? [...prefix, ...known[1](nvimArgs)] : [...prefix, ...nvimArgs]
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

function resolveExecutable(command, which, exists) {
  if (!command) return undefined
  if (path.isAbsolute(command) || command.includes('/') || command.includes('\\')) {
    return exists(command) ? command : undefined
  }
  return which(command) ?? undefined
}

function commandPointsToLauncher(
  command,
  launcherPath,
  which = whichCommand,
  exists = fs.existsSync,
) {
  if (!command || !launcherPath) return false
  let parsed
  try {
    parsed = splitCommand(command)
  } catch {
    return false
  }
  const executable = parsed[0]
  if (!executable) return false
  if (samePath(executable, launcherPath)) return true
  const resolved = resolveExecutable(executable, which, exists)
  return Boolean(resolved && samePath(resolved, launcherPath))
}

function isNvimCommand(command) {
  const base = editorBasename(command)
  return base === 'nvim' || base === 'neovim' || base === 'vim' || base === 'vi'
}

function isTerminalEditor(command) {
  return TERMINAL_EDITORS.has(editorBasename(command))
}

function editorBasename(command) {
  return path
    .basename(command)
    .replace(/\.(exe|cmd|bat)$/i, '')
    .toLowerCase()
}

function splitFileLine(token) {
  const withColumn = /^(.*):(\d+):(\d+)$/.exec(token)
  if (withColumn?.[1]) {
    return { file: withColumn[1], line: Number(withColumn[2]), column: Number(withColumn[3]) }
  }
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

function pathInside(candidate, root) {
  if (!candidate) return false
  const relative = path.relative(path.resolve(root), path.resolve(candidate))
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function pathDepth(value) {
  return path.resolve(value).split(path.sep).filter(Boolean).length
}

function fnameescape(value) {
  return value.replace(/[\s*?[\]{}`$\\%#'"|!<>]/g, '\\$&')
}

function shQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`
}

function appleQuote(value) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

function formatCommand(command, args) {
  return [command, ...args]
    .map((value) => (/^[\w./:+-]+$/.test(value) ? value : shQuote(value)))
    .join(' ')
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
if (invokedDirectly) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const launcherPath = path.join(scriptDir, process.platform === 'win32' ? 'code.cmd' : 'code')
  runCli(process.argv.slice(2), { launcherPath })
}
