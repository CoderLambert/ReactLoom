#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import * as p from '@clack/prompts'
import { scaffold } from './scaffold.js'
import { isTemplateId, templateIds } from './templates.js'

type CliOptions = {
  name: string | undefined
  template: string | undefined
  yes: boolean
  install: boolean
  dev: boolean
  help: boolean
  version: boolean
}

export type StartupChoice = 'dev' | 'install' | 'skip'

/** `--dev` installs and starts the server. `--yes` without `--dev` never starts it. */
export function resolveStartup(
  options: { yes: boolean; install: boolean; dev: boolean },
  choice?: StartupChoice,
): { install: boolean; dev: boolean } {
  if (options.dev) return { install: true, dev: true }
  if (options.yes || options.install) return { install: options.install, dev: false }
  if (choice === 'dev') return { install: true, dev: true }
  if (choice === 'install') return { install: true, dev: false }
  return { install: false, dev: false }
}

export function parseCliArgs(argv: string[]): CliOptions {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      template: { type: 'string', short: 't' },
      yes: { type: 'boolean', short: 'y', default: false },
      install: { type: 'boolean', default: false },
      dev: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false },
    },
    allowPositionals: true,
    strict: true,
  })

  const dev = values.dev ?? false
  return {
    name: positionals[0],
    template: values.template,
    yes: values.yes ?? false,
    install: (values.install ?? false) || dev,
    dev,
    help: values.help ?? false,
    version: values.version ?? false,
  }
}

function helpText(): string {
  return `create-reactloom <project> [options]

Scaffold a production ReactLoom app.

<project> is a directory name or a path. The app is created there, relative to
the directory where you ran the command (or INIT_CWD when pnpm sets it).

Templates:
  spa      Vite SPA (TanStack Router + Query)
  ssr      Next.js SSR with session cookies and Docker
  mobile   Expo / React Native

Each template's template.json lists the shared packages, configs, AI files,
and docs that are copied. Files for other templates are left out.

Options:
  -t, --template <id>   Template to copy
  -y, --yes             Skip prompts (requires name and template)
      --install         Install dependencies with pnpm
      --dev             Install dependencies and start the dev server
  -h, --help            Show this help
  -v, --version         Print the CLI version

--dev implies --install. --yes without --dev prints the next commands and
does not start a server. SPA and SSR open a browser unless CI is set or
REACTLOOM_OPEN=false. Expo does not open a browser.

Examples:
  pnpm exec create-reactloom
  pnpm exec create-reactloom studio --template spa --dev
  pnpm exec create-reactloom studio --template spa --yes
  pnpm exec create-reactloom ../outside/web --template ssr --yes --install
`
}

export function invocationDirectory(
  env: { INIT_CWD?: string } = process.env,
  cwd = process.cwd(),
): string {
  const init = env.INIT_CWD
  if (typeof init === 'string' && path.isAbsolute(init)) return init
  return cwd
}

export function isDirectInvocation(entry: string | undefined, modulePath: string): boolean {
  if (!entry) return false
  try {
    return realpathSync(modulePath) === realpathSync(entry)
  } catch {
    return path.resolve(modulePath) === path.resolve(entry)
  }
}

export function resolveProjectLocation(
  nameOrPath: string,
  baseDir: string,
): { name: string; directory: string } {
  const directory = path.resolve(baseDir, nameOrPath)
  return { directory, name: path.basename(directory) }
}

async function readOwnVersion(): Promise<string> {
  const packagePath = fileURLToPath(new URL('../package.json', import.meta.url))
  const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as { version?: string }
  return pkg.version ?? '0.0.0'
}

export async function run(argv: string[]): Promise<void> {
  const options = parseCliArgs(argv)
  if (options.help) {
    console.log(helpText())
    return
  }
  if (options.version) {
    console.log(await readOwnVersion())
    return
  }

  let name = options.name
  let template = options.template
  let startup = resolveStartup(options)

  if (!options.yes) {
    p.intro('ReactLoom')
    if (!name) {
      const entered = await p.text({
        message: 'Project name',
        placeholder: 'studio',
        validate: (value) =>
          value && /^[a-z][a-z0-9-]*$/.test(value)
            ? undefined
            : 'Use a lowercase name that starts with a letter.',
      })
      if (p.isCancel(entered)) {
        p.cancel('Scaffold cancelled.')
        process.exit(0)
      }
      name = entered
    }
    if (!template) {
      const selected = await p.select({
        message: 'Template',
        options: [
          { value: 'spa', label: 'SPA', hint: 'Vite, TanStack Router, TanStack Query' },
          { value: 'ssr', label: 'SSR', hint: 'Next.js, cookie session, Docker' },
          { value: 'mobile', label: 'Mobile', hint: 'Expo Router and React Native' },
        ],
      })
      if (p.isCancel(selected)) {
        p.cancel('Scaffold cancelled.')
        process.exit(0)
      }
      template = selected
    }
    if (!options.dev && !options.install) {
      const choice = await p.select({
        message: 'Install dependencies and start the dev server?',
        initialValue: 'dev' as const,
        options: [
          {
            value: 'dev' as const,
            label: 'Install and start',
            hint: 'pnpm install, then pnpm dev',
          },
          { value: 'install' as const, label: 'Install only' },
          { value: 'skip' as const, label: 'Skip' },
        ],
      })
      if (p.isCancel(choice)) {
        p.cancel('Scaffold cancelled.')
        process.exit(0)
      }
      startup = resolveStartup(options, choice)
    }
  }

  if (!name || !template) {
    throw new Error('Non-interactive mode requires a project name and --template.')
  }
  if (!isTemplateId(template)) {
    throw new Error(`Unknown template "${template}". Choose one of: ${templateIds.join(', ')}.`)
  }

  const baseDir = invocationDirectory()
  const location = resolveProjectLocation(name, baseDir)
  const spinner = options.yes ? undefined : p.spinner()
  spinner?.start(`Copying the ${template} template`)
  await scaffold({
    name: location.name,
    template,
    directory: location.directory,
    install: startup.install,
  })
  spinner?.stop('Project created')

  const shown = path.relative(baseDir, location.directory) || '.'
  if (startup.dev) {
    const message = [
      `Starting pnpm dev in ${shown}.`,
      'SPA and SSR open a browser unless CI is set or REACTLOOM_OPEN=false.',
      template === 'mobile'
        ? 'Expo does not open a browser. Press w for the web preview.'
        : undefined,
    ]
      .filter((line): line is string => Boolean(line))
      .join('\n')
    if (options.yes) {
      console.log(`Created ${location.directory}`)
      console.log(message)
    } else {
      p.note(message, 'Next')
      p.outro('Dev server starting')
    }
    await startDevServer(location.directory)
    return
  }

  const nextSteps = [
    `cd ${shown}`,
    startup.install ? undefined : 'pnpm install',
    template === 'mobile' ? 'pnpm start' : 'pnpm dev',
    template === 'mobile' ? undefined : 'pnpm test:e2e:setup',
  ].filter((step): step is string => Boolean(step))

  if (options.yes) {
    console.log(`Created ${location.directory}`)
    console.log(nextSteps.join('\n'))
    return
  }

  p.note(nextSteps.join('\n'), 'Next')
  p.outro('Done')
}

function startDevServer(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['dev'], { cwd, stdio: 'inherit' })
    const stop = (signal: NodeJS.Signals) => {
      if (!child.killed) child.kill(signal)
    }
    process.on('SIGINT', stop)
    process.on('SIGTERM', stop)
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      process.off('SIGINT', stop)
      process.off('SIGTERM', stop)
      if (signal) {
        process.kill(process.pid, signal)
        return
      }
      if (code === 0) resolve()
      else reject(new Error(`pnpm dev exited with code ${code ?? 'unknown'}`))
    })
  })
}

if (isDirectInvocation(process.argv[1], fileURLToPath(import.meta.url))) {
  run(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Scaffold failed.'
    console.error(message)
    process.exit(1)
  })
}
