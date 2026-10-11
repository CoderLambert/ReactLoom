import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, it } from 'vitest'
import { scaffold } from './scaffold.js'
import { type TemplateId, templateIds } from './templates.js'

const created: string[] = []

afterEach(async () => {
  await Promise.all(created.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: '1',
        EXPO_NO_TELEMETRY: '1',
      },
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`))
    })
  })
}

describe('generated project checks', () => {
  it.each(templateIds)(
    'installs, typechecks, tests, and builds the %s template',
    async (template: TemplateId) => {
      const parent = await mkdtemp(path.join(tmpdir(), 'reactloom-check-'))
      created.push(parent)
      const directory = path.join(parent, template)
      await scaffold({ name: template, template, directory })

      await runCommand('pnpm', ['install', '--prefer-offline'], directory)
      await runCommand('pnpm', ['typecheck'], directory)
      await runCommand('pnpm', ['test'], directory)
      await runCommand('pnpm', ['build'], directory)
    },
    360_000,
  )
})
