import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { TemplateId } from './templates.js'

const TEMPLATE_PACKAGE: Record<TemplateId, string> = {
  spa: '@reactloom/template-spa',
  ssr: '@reactloom/template-ssr',
  mobile: '@reactloom/template-mobile',
}

const BEST_PRACTICE_TEMPLATES = ['spa', 'ssr', 'mobile'] as const

export function adaptBestPractices(
  contents: string,
  template: TemplateId,
  projectName: string,
): string {
  let text = contents
  for (const id of BEST_PRACTICE_TEMPLATES) {
    const pattern = new RegExp(`<!-- reactloom:${id} -->[\\s\\S]*?<!-- /reactloom:${id} -->`, 'g')
    text =
      id === template
        ? text.replace(pattern, (block) =>
            block
              .replaceAll(`<!-- reactloom:${id} -->`, '')
              .replaceAll(`<!-- /reactloom:${id} -->`, ''),
          )
        : text.replace(pattern, '')
  }
  const collapsed = text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return `${adaptAiText(collapsed, template, projectName)}\n`
}

export function adaptAiText(contents: string, template: TemplateId, projectName: string): string {
  const directoryPrefix = `templates/${template}/`
  const rewritten = contents
    .replaceAll(directoryPrefix, '')
    .replaceAll(`templates/${template}`, '.')
    .replaceAll(TEMPLATE_PACKAGE[template], projectName)

  return rewritten.replace(/^globs:\s*"?(.*?)"?\s*$/m, (_line, raw: string) => {
    const kept = splitGlobs(raw).filter((glob) => !glob.includes('templates/'))
    if (kept.length === 0) {
      throw new Error(`Adaptation removed every glob for the ${template} template.`)
    }
    return `globs: ${kept.join(',')}`
  })
}

function splitGlobs(value: string): string[] {
  const globs: string[] = []
  let current = ''
  let depth = 0
  for (const char of value) {
    if (char === '{') depth += 1
    if (char === '}' && depth > 0) depth -= 1
    if (char === ',' && depth === 0) {
      const glob = current.trim()
      if (glob) globs.push(glob)
      current = ''
      continue
    }
    current += char
  }
  const glob = current.trim()
  if (glob) globs.push(glob)
  return globs
}

export async function installAiConfig(options: {
  repoRoot: string
  directory: string
  template: TemplateId
  projectName: string
  rules: readonly string[]
  pointers: readonly string[]
}): Promise<void> {
  const agentsPath = path.join(options.directory, 'AGENTS.md')
  const agents = await readFile(agentsPath, 'utf8')
  await writeFile(agentsPath, adaptAiText(agents, options.template, options.projectName))

  const rulesDir = path.join(options.directory, '.cursor', 'rules')
  await mkdir(rulesDir, { recursive: true })
  for (const rule of options.rules) {
    const source = await readFile(path.join(options.repoRoot, '.cursor', 'rules', rule), 'utf8')
    await writeFile(
      path.join(rulesDir, rule),
      adaptAiText(source, options.template, options.projectName),
    )
  }

  for (const relative of options.pointers) {
    const source = await readFile(path.join(options.repoRoot, relative), 'utf8')
    const destination = path.join(options.directory, relative)
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, adaptAiText(source, options.template, options.projectName))
  }
}
