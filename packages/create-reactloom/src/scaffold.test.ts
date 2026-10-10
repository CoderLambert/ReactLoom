import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parseCliArgs } from './cli.js'
import { scaffold } from './scaffold.js'

const created: string[] = []

afterEach(async () => {
  await Promise.all(created.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function tempParent(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'reactloom-'))
  created.push(dir)
  return dir
}

describe('create-reactloom', () => {
  it('parses flags and a positional name', () => {
    expect(parseCliArgs(['studio', '--template', 'ssr', '--yes', '--install'])).toMatchObject({
      name: 'studio',
      template: 'ssr',
      yes: true,
      install: true,
    })
  })

  it('scaffolds the spa template and removes template-only files', async () => {
    const parent = await tempParent()
    const directory = path.join(parent, 'studio')
    await scaffold({ name: 'studio', template: 'spa', directory })

    const pkg = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8')) as {
      name: string
      dependencies: Record<string, string>
    }
    expect(pkg.name).toBe('studio')
    expect(pkg.dependencies['@reactloom/api-client']).toBe('workspace:*')
    await expect(stat(path.join(directory, 'template.json'))).rejects.toThrow()
    await expect(stat(path.join(directory, 'src', 'main.tsx'))).resolves.toBeTruthy()
    await expect(
      stat(path.join(directory, 'packages', 'api-client', 'src', 'index.ts')),
    ).resolves.toBeTruthy()
    await expect(
      stat(path.join(directory, 'packages', 'tsconfig', 'base.json')),
    ).resolves.toBeTruthy()
    await expect(stat(path.join(directory, 'biome.json'))).resolves.toBeTruthy()
    const workspace = await readFile(path.join(directory, 'pnpm-workspace.yaml'), 'utf8')
    expect(workspace).toContain('packages/*')
    const envExample = await readFile(path.join(directory, '.env.example'), 'utf8')
    expect(envExample).toContain('VITE_API_BASE_URL')
    await expect(stat(path.join(directory, '.env'))).rejects.toThrow()
  })

  it('scaffolds ssr with a standalone Dockerfile and rewritten trace root', async () => {
    const parent = await tempParent()
    const directory = path.join(parent, 'web')
    await scaffold({ name: 'web', template: 'ssr', directory })

    await expect(stat(path.join(directory, 'Dockerfile'))).resolves.toBeTruthy()
    await expect(stat(path.join(directory, 'Dockerfile.monorepo'))).rejects.toThrow()
    await expect(stat(path.join(directory, 'Dockerfile.standalone'))).rejects.toThrow()
    const config = await readFile(path.join(directory, 'next.config.ts'), 'utf8')
    expect(config).toContain('import.meta.dirname')
    expect(config).not.toContain('../..')
  })

  it('rejects unsafe project names', async () => {
    const parent = await tempParent()
    await expect(
      scaffold({ name: 'Bad Name', template: 'mobile', directory: path.join(parent, 'app') }),
    ).rejects.toThrow(/lowercase/)
  })
})
