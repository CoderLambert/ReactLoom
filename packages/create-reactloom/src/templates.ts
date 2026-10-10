import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const templateIds = ['spa', 'ssr', 'mobile'] as const

export type TemplateId = (typeof templateIds)[number]

export type TemplateManifest = {
  id: TemplateId
  description: string
  strip?: string[]
  rename?: Record<string, string>
  replacements?: Array<{ file: string; from: string; to: string }>
}

export function isTemplateId(value: string): value is TemplateId {
  return templateIds.some((id) => id === value)
}

export async function findRepoRoot(start: string): Promise<string> {
  let dir = start
  for (let depth = 0; depth < 8; depth += 1) {
    try {
      await access(path.join(dir, 'templates', 'spa', 'template.json'))
      await access(path.join(dir, 'pnpm-workspace.yaml'))
      return dir
    } catch {
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  throw new Error(
    'Could not find the ReactLoom templates. Run create-reactloom from this repository.',
  )
}

export async function resolveTemplatesRoot(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const root = await findRepoRoot(here)
  return path.join(root, 'templates')
}

export async function readManifest(templateDir: string): Promise<TemplateManifest> {
  const raw = await readFile(path.join(templateDir, 'template.json'), 'utf8')
  return JSON.parse(raw) as TemplateManifest
}
