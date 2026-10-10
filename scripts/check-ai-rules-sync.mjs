import { readFileSync } from 'node:fs'

const storybookBases = ['templates/spa/package.json', 'templates/ssr/package.json']

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function exists(file) {
  try {
    readFileSync(file)
    return true
  } catch {
    return false
  }
}

function frontmatter(file) {
  const text = readFileSync(file, 'utf8')
  if (!text.startsWith('---\n')) {
    throw new Error(`${file} is missing YAML frontmatter`)
  }
  const end = text.indexOf('\n---', 4)
  if (end === -1) throw new Error(`${file} frontmatter is not closed`)
  const data = {}
  for (const line of text.slice(4, end).split('\n')) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line.trim())
    if (!match) continue
    data[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
  return data
}

function major(version) {
  return version.split('.')[0]
}

function minor(version) {
  return version.split('.').slice(0, 2).join('.')
}

function dependency(pkg, name) {
  return pkg.devDependencies?.[name] ?? pkg.dependencies?.[name]
}

const mono = exists('templates/spa/package.json')
const packageFiles = mono ? storybookBases.filter((file) => exists(file)) : ['package.json']
const ruleFiles = ['.cursor/rules/storybook.mdc', 'docs/agents/storybook.md']
const failures = []

for (const packageFile of packageFiles) {
  const pkg = readJson(packageFile)
  const storybook = dependency(pkg, 'storybook')
  const addon = dependency(pkg, '@storybook/addon-mcp')
  if (!storybook && !addon) continue
  if (!storybook || !addon) {
    failures.push(`${packageFile} must depend on both storybook and @storybook/addon-mcp`)
    continue
  }
  for (const ruleFile of ruleFiles) {
    if (!exists(ruleFile)) {
      failures.push(`${packageFile} has Storybook ${storybook}, but ${ruleFile} is missing`)
      continue
    }
    const meta = frontmatter(ruleFile)
    if (!meta.storybook || !meta['addon-mcp']) {
      failures.push(`${ruleFile} must set storybook and addon-mcp in frontmatter`)
      continue
    }
    if (major(storybook) !== major(meta.storybook)) {
      failures.push(
        `${ruleFile} storybook ${meta.storybook} does not match ${packageFile} major ${storybook}`,
      )
    }
    if (minor(addon) !== minor(meta['addon-mcp'])) {
      failures.push(
        `${ruleFile} addon-mcp ${meta['addon-mcp']} does not match ${packageFile} minor ${addon}`,
      )
    }
  }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`)
  process.exit(1)
}
