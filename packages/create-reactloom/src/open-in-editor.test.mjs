import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  activateLauncher,
  claimEditorEnv,
  parseLocation,
  planLaunch,
  runCli,
  splitCommand,
} from '../../../scripts/open-in-editor.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const file = '/tmp/proj/src/app.tsx'
const location = { file, line: 14, column: 9 }
const launcherPath = '/opt/reactloom/scripts/code'

function ctx(overrides = {}) {
  return {
    env: {},
    cwd: '/tmp/proj',
    gitRoot: '/tmp/proj',
    platform: 'linux',
    processes: [],
    launcherPath,
    which: () => null,
    exists: () => false,
    isSocket: () => false,
    scanSockets: () => [],
    removeSocket: vi.fn(),
    readFile: () => {
      throw new Error('missing')
    },
    hasTty: false,
    ...overrides,
  }
}

function whichMap(entries) {
  return (command) => entries[command] ?? null
}

function nvimContext(overrides = {}) {
  return ctx({ which: whichMap({ nvim: '/usr/bin/nvim' }), ...overrides })
}

afterEach(() => {
  process.exitCode = undefined
  vi.restoreAllMocks()
})

describe('parseLocation', () => {
  it('reads inspector forms and Windows paths', () => {
    expect(parseLocation(['-r', '-g', `${file}:14:9`])).toEqual(location)
    expect(parseLocation(['+call cursor(14, 9)', file])).toEqual(location)
    expect(parseLocation(['--doctor', `${file}:14`])).toEqual({ file, line: 14, column: 1 })
    expect(parseLocation(['C:\\foo\\bar.tsx:14:9'])).toEqual({
      file: 'C:\\foo\\bar.tsx',
      line: 14,
      column: 9,
    })
  })

  it('returns null when no file is present', () => {
    expect(parseLocation(['-g', '-r', ''])).toBeNull()
  })
})

describe('splitCommand', () => {
  it('splits editor arguments with shell-style quoting', () => {
    expect(splitCommand('omarchy-launch-editor --inline "two words" \'three words\'')).toEqual([
      'omarchy-launch-editor',
      '--inline',
      'two words',
      'three words',
    ])
  })

  it('rejects an unclosed quote', () => {
    expect(() => splitCommand('cursor "broken')).toThrow(/未闭合/)
  })
})

describe('planLaunch', () => {
  it('uses desktop activation for VS Code before Neovim and ambient editor settings', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { EDITOR: 'nvim' },
        which: whichMap({
          code: '/usr/bin/code',
          'xdg-open': '/usr/bin/xdg-open',
          nvim: '/usr/bin/nvim',
        }),
      }),
    )
    expect(plan).toMatchObject({
      ok: true,
      command: '/usr/bin/xdg-open',
      args: ['vscode://file/tmp/proj/src/app.tsx:14:9'],
      method: '默认 VS Code（桌面激活）',
    })
  })

  it('falls back to the VS Code CLI when desktop activation is unavailable', () => {
    const plan = planLaunch(location, ctx({ which: whichMap({ code: '/usr/bin/code' }) }))
    expect(plan).toMatchObject({
      ok: true,
      command: '/usr/bin/code',
      args: ['-r', '-g', `${file}:14:9`],
      method: '默认 VS Code',
    })
  })

  it('preserves parameters in EDITOR when a TTY is available', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { EDITOR: 'omarchy-launch-editor --inline "work pane"' },
        hasTty: true,
        which: whichMap({ 'omarchy-launch-editor': '/usr/bin/omarchy-launch-editor' }),
      }),
    )
    expect(plan).toMatchObject({
      ok: true,
      command: '/usr/bin/omarchy-launch-editor',
      args: ['--inline', 'work pane', `${file}:14:9`],
      wait: true,
      method: 'EDITOR',
    })
  })

  it('reads a quoted explicit editor from the template .env.local', () => {
    const plan = planLaunch(
      location,
      ctx({
        configDir: '/tmp/proj',
        readFile: (name) => {
          expect(name).toBe('/tmp/proj/.env.local')
          return 'LAUNCH_EDITOR="cursor --reuse-window"\n'
        },
        which: whichMap({ cursor: '/usr/bin/cursor' }),
      }),
    )
    expect(plan).toMatchObject({
      command: '/usr/bin/cursor',
      args: ['--reuse-window', '-g', `${file}:14:9`],
      method: '显式编辑器 LAUNCH_EDITOR',
    })
  })

  it('routes explicit LAUNCH_EDITOR=nvim through the project server', () => {
    const plan = planLaunch(
      location,
      nvimContext({
        env: { LAUNCH_EDITOR: 'nvim --clean' },
        isSocket: (address) => address === '/tmp/proj/.nvim.sock',
        probeNvim: () => ({ ok: true, cwd: '/tmp/proj' }),
      }),
    )
    expect(plan).toMatchObject({
      ok: true,
      command: '/usr/bin/nvim',
      method: 'Neovim server /tmp/proj/.nvim.sock',
    })
    expect(plan.args.slice(0, 4)).toEqual([
      '--clean',
      '--server',
      '/tmp/proj/.nvim.sock',
      '--remote-send',
    ])
  })

  it('walks from the clicked file to the git root for .nvim.sock', () => {
    const nestedFile = '/tmp/proj/packages/app/src/view.tsx'
    const plan = planLaunch(
      { file: nestedFile, line: 3, column: 4 },
      nvimContext({
        isSocket: (address) => address === '/tmp/proj/packages/app/.nvim.sock',
        probeNvim: () => ({ ok: true, cwd: '/tmp/proj/packages/app' }),
      }),
    )
    expect(plan.args).toContain('/tmp/proj/packages/app/.nvim.sock')
    expect(plan.args.at(-1)).toContain(
      ':drop /tmp/proj/packages/app/src/view.tsx | call cursor(3, 4)<CR>',
    )
  })

  it('uses a matching XDG runtime socket and mocks remote-expr spawn', () => {
    const spawnMock = vi.fn((command, args, options) => {
      expect(command).toBe('/usr/bin/nvim')
      expect(args).toEqual(['--server', '/run/user/1000/nvim.123.0', '--remote-expr', 'getcwd()'])
      expect(options.timeout).toBe(1000)
      return { status: 0, stdout: '/tmp/proj\n', stderr: '' }
    })
    const plan = planLaunch(
      location,
      nvimContext({
        isSocket: (address) => address === '/run/user/1000/nvim.123.0',
        scanSockets: () => ['/run/user/1000/nvim.123.0'],
        spawnSync: spawnMock,
      }),
    )
    expect(plan.args).toContain('/run/user/1000/nvim.123.0')
    expect(spawnMock).toHaveBeenCalledOnce()
  })

  it('chooses the deepest cwd among this project and rejects other projects', () => {
    const sockets = ['/run/nvim.1.0', '/run/nvim.2.0', '/run/nvim.3.0']
    const cwdBySocket = {
      '/run/nvim.1.0': '/tmp/proj',
      '/run/nvim.2.0': '/tmp/proj/packages/app',
      '/run/nvim.3.0': '/tmp/another-project',
    }
    const plan = planLaunch(
      location,
      nvimContext({
        isSocket: (address) => sockets.includes(address),
        scanSockets: () => sockets,
        probeNvim: (address) => ({ ok: true, cwd: cwdBySocket[address] }),
      }),
    )
    expect(plan.args).toContain('/run/nvim.2.0')
    expect(plan.debug.join('\n')).toContain('其他项目')
  })

  it('requires inherited NVIM to be live and inside this project', () => {
    const plan = planLaunch(
      location,
      nvimContext({
        env: { NVIM: '/run/foreign.sock' },
        isSocket: (address) => address === '/run/foreign.sock' || address === '/run/local.sock',
        scanSockets: () => ['/run/local.sock'],
        probeNvim: (address) => ({
          ok: true,
          cwd: address === '/run/foreign.sock' ? '/tmp/other' : '/tmp/proj',
        }),
      }),
    )
    expect(plan.args).toContain('/run/local.sock')
    expect(plan.args).not.toContain('/run/foreign.sock')
  })

  it('skips stale sockets, removes only a confirmed project .nvim.sock, and logs both', () => {
    const removeSocket = vi.fn()
    const plan = planLaunch(
      location,
      nvimContext({
        isSocket: (address) =>
          address === '/tmp/proj/.nvim.sock' ||
          address === '/run/stale.sock' ||
          address === '/run/live.sock',
        scanSockets: () => ['/run/stale.sock', '/run/live.sock'],
        probeNvim: (address) =>
          address === '/run/live.sock'
            ? { ok: true, cwd: '/tmp/proj' }
            : { ok: false, reason: '连接被拒绝' },
        removeSocket,
      }),
    )
    expect(plan.args).toContain('/run/live.sock')
    expect(removeSocket).toHaveBeenCalledWith('/tmp/proj/.nvim.sock')
    expect(removeSocket).not.toHaveBeenCalledWith('/run/stale.sock')
    expect(plan.debug.join('\n')).toContain('失效运行时 socket')
  })

  it('escapes spaces and Ex-special characters in the remote-send path', () => {
    const special = '/tmp/proj/a b/x|y#z.tsx'
    const plan = planLaunch(
      { file: special, line: 2, column: 7 },
      nvimContext({
        isSocket: (address) => address === '/tmp/proj/.nvim.sock',
        probeNvim: () => ({ ok: true, cwd: '/tmp/proj' }),
      }),
    )
    expect(plan.args.at(-1)).toBe(
      '<C-\\><C-N>:drop /tmp/proj/a\\ b/x\\|y\\#z.tsx | call cursor(2, 7)<CR>',
    )
  })

  it('skips a terminal EDITOR without a TTY and uses a running Cursor', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { EDITOR: 'omarchy-launch-editor --inline' },
        which: whichMap({ 'omarchy-launch-editor': '/usr/bin/omarchy-launch-editor' }),
        processes: [{ comm: 'cursor', exe: '/usr/bin/cursor' }],
      }),
    )
    expect(plan.method).toBe('正在运行的 Cursor / VS Code')
    expect(plan.attempts.join('\n')).toContain('没有 TTY')
  })

  it('uses tmux before a terminal emulator', () => {
    const plan = planLaunch(
      location,
      nvimContext({
        env: { TMUX: '/tmp/tmux-1000/default,123,0' },
        which: whichMap({ nvim: '/usr/bin/nvim', tmux: '/usr/bin/tmux', kitty: '/usr/bin/kitty' }),
      }),
    )
    expect(plan).toMatchObject({
      command: '/usr/bin/tmux',
      args: ['new-window', '-c', '/tmp/proj', '/usr/bin/nvim', '+14', file],
      method: 'tmux 新窗口',
    })
  })

  it('reports every failed strategy with actionable Chinese guidance', () => {
    const plan = planLaunch(location, ctx())
    expect(plan.ok).toBe(false)
    expect(plan.reason).toContain('显式编辑器')
    expect(plan.reason).toContain('Neovim server')
    expect(plan.reason).toContain('VISUAL / EDITOR')
    expect(plan.reason).toContain('Cursor / VS Code')
    expect(plan.reason).toContain('tmux')
    expect(plan.reason).toContain('LAUNCH_EDITOR')
    expect(plan.reason).toContain('init.lua')
  })
})

describe('launcher activation', () => {
  const temps = []

  afterEach(() => {
    for (const dir of temps.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  it('stashes an explicit command with arguments and points inspectors at the shim', () => {
    const env = { LAUNCH_EDITOR: 'cursor --reuse-window', EDITOR: 'nvim' }
    claimEditorEnv(launcherPath, env)
    expect(env).toEqual({
      LAUNCH_EDITOR: launcherPath,
      CODE_EDITOR: launcherPath,
      REACT_EDITOR: launcherPath,
      REACTLOOM_EDITOR: 'cursor --reuse-window',
      EDITOR: 'nvim',
    })
  })

  it('loads .env.local beside a generated project before claiming variables', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reactloom-editor-'))
    temps.push(dir)
    fs.mkdirSync(path.join(dir, 'scripts'))
    fs.writeFileSync(path.join(dir, 'scripts', 'open-in-editor.mjs'), '\n')
    fs.writeFileSync(path.join(dir, 'scripts', 'code'), '\n')
    fs.writeFileSync(path.join(dir, 'scripts', 'code.cmd'), '\n')
    fs.writeFileSync(path.join(dir, '.env.local'), 'LAUNCH_EDITOR="cursor --reuse-window"\n')
    const env = {}
    const command = activateLauncher(dir, env)
    expect(command).toBe(
      path.join(dir, 'scripts', process.platform === 'win32' ? 'code.cmd' : 'code'),
    )
    expect(env.REACTLOOM_EDITOR).toBe('cursor --reuse-window')
    expect(env.REACTLOOM_CONFIG_DIR).toBe(dir)
  })

  it('uses the monorepo scripts when the template directory has none', () => {
    const env = {}
    const command = activateLauncher(path.join(repoRoot, 'templates', 'spa'), env)
    expect(command).toBe(
      path.join(repoRoot, 'scripts', process.platform === 'win32' ? 'code.cmd' : 'code'),
    )
  })
})

describe('runCli', () => {
  it('does not recursively launch its own inspector shim from the real entry point', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reactloom-editor-path-'))
    const fakeCode = path.join(dir, process.platform === 'win32' ? 'code.cmd' : 'code')
    fs.writeFileSync(fakeCode, '')
    fs.chmodSync(fakeCode, 0o755)
    const realLauncher = path.join(
      repoRoot,
      'scripts',
      process.platform === 'win32' ? 'code.cmd' : 'code',
    )
    const result = spawnSync(
      process.execPath,
      [path.join(repoRoot, 'scripts', 'open-in-editor.mjs'), '--doctor', `${file}:14:9`],
      {
        encoding: 'utf8',
        env: {
          PATH: `${dir}${path.delimiter}${process.env.PATH ?? ''}`,
          LAUNCH_EDITOR: realLauncher,
          CODE_EDITOR: realLauncher,
          REACT_EDITOR: realLauncher,
        },
        timeout: 2_000,
      },
    )
    fs.rmSync(dir, { recursive: true, force: true })

    expect(result.error).toBeUndefined()
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('选择：默认 VS Code')
    expect(result.stdout).not.toContain('选择：显式编辑器')
  })

  it('diagnoses without spawning an editor', () => {
    const log = vi.fn()
    const spawnMock = vi.fn()
    const plan = runCli(
      ['--doctor', `${file}:14`],
      ctx({
        env: { LAUNCH_EDITOR: 'cursor' },
        which: whichMap({ cursor: '/usr/bin/cursor' }),
        log,
        spawn: spawnMock,
      }),
    )
    expect(plan.ok).toBe(true)
    expect(spawnMock).not.toHaveBeenCalled()
    expect(log.mock.calls.flat().join('\n')).toContain('不会打开文件')
    expect(log.mock.calls.flat().join('\n')).toContain('显式编辑器 LAUNCH_EDITOR')
  })

  it('uses an injected spawn for a non-waiting editor plan', () => {
    const child = { on: vi.fn(), unref: vi.fn() }
    const spawnMock = vi.fn(() => child)
    runCli(
      [`${file}:14:9`],
      ctx({
        env: { LAUNCH_EDITOR: 'cursor' },
        which: whichMap({ cursor: '/usr/bin/cursor' }),
        spawn: spawnMock,
      }),
    )
    expect(spawnMock).toHaveBeenCalledWith('/usr/bin/cursor', ['-g', `${file}:14:9`], {
      detached: true,
      stdio: 'ignore',
    })
    expect(child.unref).toHaveBeenCalled()
  })
})
