import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  activateLauncher,
  claimEditorEnv,
  failureReason,
  parseLocation,
  planLaunch,
  runCli,
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
    isSocket: () => false,
    ...overrides,
  }
}

function nvimWhich(extra = {}) {
  return (command) => {
    if (command === 'nvim') return '/usr/bin/nvim'
    return extra[command] ?? null
  }
}

afterEach(() => {
  process.exitCode = undefined
})

describe('parseLocation', () => {
  it('reads file:line:column after inspector flags', () => {
    expect(parseLocation(['-r', '-g', `${file}:14:9`])).toEqual(location)
    expect(parseLocation(['/workspace', '-g', `${file}:14:9`])).toEqual(location)
  })

  it('reads a Windows path from the rightmost colon pair', () => {
    expect(parseLocation(['-g', 'C:\\foo\\bar.tsx:14:9'])).toEqual({
      file: 'C:\\foo\\bar.tsx',
      line: 14,
      column: 9,
    })
  })

  it('reads +line, a cursor call, positionals, and flags', () => {
    expect(parseLocation(['+14', file])).toEqual({ file, line: 14, column: 1 })
    expect(parseLocation(['+call cursor(14, 9)', file])).toEqual(location)
    expect(parseLocation([file, '14', '9'])).toEqual(location)
    expect(parseLocation(['--line', '14', '--column', '9', file])).toEqual(location)
  })

  it('returns null when no file is present', () => {
    expect(parseLocation(['-g', '-r', ''])).toBeNull()
  })
})

describe('planLaunch', () => {
  it('opens a project socket in the running Neovim server', () => {
    const plan = planLaunch(
      location,
      ctx({
        which: nvimWhich(),
        isSocket: (address) => address === '/tmp/proj/.nvim.sock',
      }),
    )
    expect(plan).toEqual({
      ok: true,
      command: '/usr/bin/nvim',
      args: ['--server', '/tmp/proj/.nvim.sock', '--remote', '+14', file],
      wait: true,
    })
  })

  it('prefers a host:port NVIM address over .nvim.sock', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { NVIM: '127.0.0.1:7777' },
        which: nvimWhich(),
        isSocket: (address) => address.endsWith('.nvim.sock'),
      }),
    )
    expect(plan.args).toContain('127.0.0.1:7777')
    expect(plan.args).not.toContain('/tmp/proj/.nvim.sock')
  })

  it('accepts a named pipe and NVIM_LISTEN_ADDRESS', () => {
    const pipe = planLaunch(
      location,
      ctx({
        env: { NVIM: '\\\\.\\pipe\\nvim' },
        which: nvimWhich(),
      }),
    )
    expect(pipe.args[1]).toBe('\\\\.\\pipe\\nvim')

    const listen = planLaunch(
      location,
      ctx({
        env: { NVIM_LISTEN_ADDRESS: '127.0.0.1:9999' },
        which: nvimWhich(),
      }),
    )
    expect(listen.args).toContain('127.0.0.1:9999')
  })

  it('ignores a NVIM value that is not a listen address and uses .nvim.sock', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { NVIM: '/tmp/not-a-socket' },
        which: nvimWhich(),
        isSocket: (address) => address === '/tmp/proj/.nvim.sock',
      }),
    )
    expect(plan.args).toContain('/tmp/proj/.nvim.sock')
  })

  it('walks parents up to the git root and stops there', () => {
    const plan = planLaunch(
      location,
      ctx({
        cwd: '/repo/packages/app',
        gitRoot: '/repo',
        which: nvimWhich(),
        isSocket: (address) => address === '/repo/.nvim.sock',
      }),
    )
    expect(plan.args).toContain('/repo/.nvim.sock')

    const above = planLaunch(
      location,
      ctx({
        cwd: '/repo/packages/app',
        gitRoot: '/repo',
        which: nvimWhich(),
        isSocket: (address) => address === '/.nvim.sock',
      }),
    )
    expect(above.ok).toBe(false)
  })

  it('lets an explicit Cursor command beat a live Neovim socket', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { LAUNCH_EDITOR: 'cursor' },
        which: nvimWhich(),
        isSocket: () => true,
      }),
    )
    expect(plan).toEqual({
      ok: true,
      command: 'cursor',
      args: ['-g', `${file}:14:9`],
      wait: false,
    })
  })

  it('lets LAUNCH_EDITOR beat EDITOR', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { LAUNCH_EDITOR: 'cursor', EDITOR: 'nvim' },
        which: nvimWhich(),
        isSocket: () => true,
      }),
    )
    expect(plan.command).toBe('cursor')
  })

  it('keeps an explicit nvim command off the GUI path', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { EDITOR: 'nvim' },
        processes: [{ comm: 'cursor', exe: '/usr/bin/cursor' }],
        which: nvimWhich({ kitty: '/usr/bin/kitty' }),
      }),
    )
    expect(plan).toEqual({
      ok: true,
      command: '/usr/bin/kitty',
      args: ['/usr/bin/nvim', '+14', file],
      wait: false,
    })
  })

  it('uses an absolute nvim binary when nvim is not on PATH', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { EDITOR: '/opt/bin/nvim' },
        which: (command) => (command === 'kitty' ? '/usr/bin/kitty' : null),
      }),
    )
    expect(plan.args[0]).toBe('/opt/bin/nvim')
  })

  it('ignores a launcher path stored as the editor and uses the socket', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { LAUNCH_EDITOR: launcherPath },
        which: nvimWhich(),
        isSocket: (address) => address === '/tmp/proj/.nvim.sock',
      }),
    )
    expect(plan.command).toBe('/usr/bin/nvim')
    expect(plan.wait).toBe(true)
  })

  it('skips code when which(code) is the launcher itself', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { LAUNCH_EDITOR: 'code' },
        which: (command) => {
          if (command === 'code') return launcherPath
          if (command === 'nvim') return '/usr/bin/nvim'
          return null
        },
        isSocket: (address) => address === '/tmp/proj/.nvim.sock',
      }),
    )
    expect(plan.command).toBe('/usr/bin/nvim')
  })

  it('spawns a real code binary when LAUNCH_EDITOR=code', () => {
    const plan = planLaunch(
      location,
      ctx({
        env: { LAUNCH_EDITOR: 'code' },
        which: (command) => (command === 'code' ? '/usr/bin/code' : null),
      }),
    )
    expect(plan).toEqual({
      ok: true,
      command: 'code',
      args: ['-g', `${file}:14:9`],
      wait: false,
    })
  })

  it('prefers a running Cursor over a running VS Code', () => {
    const plan = planLaunch(
      location,
      ctx({
        processes: [
          { comm: 'code', exe: '/usr/bin/code' },
          { comm: 'cursor', exe: '/usr/bin/cursor' },
        ],
      }),
    )
    expect(plan).toEqual({
      ok: true,
      command: '/usr/bin/cursor',
      args: ['-r', '-g', `${file}:14:9`],
      wait: false,
    })
  })

  it('does not treat the launcher process as VS Code', () => {
    const plan = planLaunch(
      location,
      ctx({
        processes: [{ comm: 'code', exe: launcherPath }],
      }),
    )
    expect(plan.ok).toBe(false)
  })

  it('opens a new terminal nvim when that is feasible', () => {
    const kitty = planLaunch(
      location,
      ctx({
        which: nvimWhich({ kitty: '/usr/bin/kitty' }),
      }),
    )
    expect(kitty).toEqual({
      ok: true,
      command: '/usr/bin/kitty',
      args: ['/usr/bin/nvim', '+14', file],
      wait: false,
    })

    const gnome = planLaunch(
      location,
      ctx({
        which: nvimWhich({ 'gnome-terminal': '/usr/bin/gnome-terminal' }),
      }),
    )
    expect(gnome.args).toEqual(['--', '/usr/bin/nvim', '+14', file])

    const mac = planLaunch(
      location,
      ctx({
        platform: 'darwin',
        which: nvimWhich({ osascript: '/usr/bin/osascript' }),
      }),
    )
    expect(mac.command).toBe('/usr/bin/osascript')
    expect(mac.args[1]).toContain("/usr/bin/nvim +14 '/tmp/proj/src/app.tsx'")

    const windows = planLaunch(
      location,
      ctx({
        platform: 'win32',
        which: (command) => {
          if (command === 'nvim') return 'C:\\nvim\\nvim.exe'
          if (command === 'wt') return 'C:\\Windows\\wt.exe'
          return null
        },
      }),
    )
    expect(windows).toEqual({
      ok: true,
      command: 'C:\\Windows\\wt.exe',
      args: ['nvim', '+14', file],
      wait: false,
    })
  })

  it('explains the one-time Neovim setup when nothing can open the file', () => {
    const plan = planLaunch(location, ctx())
    expect(plan.ok).toBe(false)
    expect(plan.reason).toBe(failureReason())
    expect(plan.reason).toContain('nvim --listen .nvim.sock')
    expect(plan.reason).toContain('LAUNCH_EDITOR=cursor')
  })
})

describe('claimEditorEnv', () => {
  it('stashes the explicit editor and points the inspector variables at the shim', () => {
    const env = { LAUNCH_EDITOR: 'cursor', EDITOR: 'nvim' }
    claimEditorEnv(launcherPath, env)
    expect(env).toEqual({
      LAUNCH_EDITOR: launcherPath,
      CODE_EDITOR: launcherPath,
      REACT_EDITOR: launcherPath,
      REACTLOOM_EDITOR: 'cursor',
      EDITOR: 'nvim',
    })
  })

  it('does not stash the shim path as the user editor', () => {
    const env = { LAUNCH_EDITOR: launcherPath, EDITOR: 'nvim' }
    claimEditorEnv(launcherPath, env)
    expect(env.REACTLOOM_EDITOR).toBeUndefined()
    expect(env.EDITOR).toBe('nvim')
    expect(env.LAUNCH_EDITOR).toBe(launcherPath)
  })
})

describe('activateLauncher', () => {
  const temps = []

  afterEach(() => {
    for (const dir of temps.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  it('uses the repo scripts when the template directory has none', () => {
    const env = {}
    const command = activateLauncher(path.join(repoRoot, 'templates', 'spa'), env)
    const name = process.platform === 'win32' ? 'code.cmd' : 'code'
    expect(command).toBe(path.join(repoRoot, 'scripts', name))
    expect(env.LAUNCH_EDITOR).toBe(command)
    expect(env.CODE_EDITOR).toBe(command)
    expect(env.REACT_EDITOR).toBe(command)
  })

  it('uses scripts beside a generated project', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reactloom-editor-'))
    temps.push(dir)
    fs.mkdirSync(path.join(dir, 'scripts'))
    fs.writeFileSync(path.join(dir, 'scripts', 'open-in-editor.mjs'), '\n')
    fs.writeFileSync(path.join(dir, 'scripts', 'code'), '\n')
    fs.writeFileSync(path.join(dir, 'scripts', 'code.cmd'), '\n')
    const env = { LAUNCH_EDITOR: 'cursor' }
    const command = activateLauncher(dir, env)
    const name = process.platform === 'win32' ? 'code.cmd' : 'code'
    expect(command).toBe(path.join(dir, 'scripts', name))
    expect(env.REACTLOOM_EDITOR).toBe('cursor')
  })

  it('throws when the shim is missing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reactloom-editor-'))
    temps.push(dir)
    expect(() => activateLauncher(dir, {})).toThrow(/open-in-editor.mjs/)
  })
})

describe('runCli', () => {
  it('does not spawn an editor when arguments or an editor are missing', () => {
    runCli([])
    expect(process.exitCode).toBe(1)
    process.exitCode = undefined
    runCli([`${file}:14:9`], ctx())
    expect(process.exitCode).toBe(1)
  })
})
