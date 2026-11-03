import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseManifest, readManifest, templateIds } from './templates.js'

const templateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../templates')

function validManifest(): Record<string, unknown> {
  return {
    id: 'mobile',
    description: 'Manifest path tests',
    packages: { 'api-client': true, devtools: true, tsconfig: ['base.json'] },
    configs: ['.npmrc'],
    ci: '.github/workflows/ci.yml',
    docker: false,
    ai: { pointers: ['CLAUDE.md'], rules: ['mobile.mdc'] },
    docs: ['docs/getting-started.md'],
  }
}

const pathFields = [
  'configs',
  'docs',
  'strip',
  'ci',
  'ai.pointers',
  'ai.rules',
  'rename.source',
  'rename.target',
  'replacements.file',
] as const

type PathField = (typeof pathFields)[number]

function manifestWithPath(field: PathField, candidate: string): Record<string, unknown> {
  const manifest = validManifest()
  switch (field) {
    case 'configs':
    case 'docs':
    case 'strip':
      manifest[field] = [candidate]
      break
    case 'ci':
      manifest.ci = candidate
      break
    case 'ai.pointers':
      manifest.ai = { pointers: [candidate], rules: ['mobile.mdc'] }
      break
    case 'ai.rules':
      manifest.ai = { pointers: ['CLAUDE.md'], rules: [candidate] }
      break
    case 'rename.source':
      manifest.rename = { [candidate]: 'README.md' }
      break
    case 'rename.target':
      manifest.rename = { 'README.md': candidate }
      break
    case 'replacements.file':
      manifest.replacements = [{ file: candidate, from: 'old', to: 'new' }]
      break
  }
  return manifest
}

describe('template.json filesystem path containment', () => {
  it.each(templateIds)('accepts the existing %s manifest', async (template) => {
    const parsed = await readManifest(path.join(templateRoot, template))
    expect(parsed.id).toBe(template)
  })

  it.each([
    '../outside',
    '../../outside',
    '/tmp/outside',
    'nested/../outside',
    './same',
    'nested/./same',
    'nested//inside',
    'C:/outside',
    'C:\\outside',
    '..\\outside',
    '\\\\server\\share',
    'safe\u0000file',
  ])('rejects traversal or nonportable path %s in every path field', (candidate) => {
    for (const field of pathFields) {
      expect(
        () => parseManifest(manifestWithPath(field, candidate)),
        `Field ${field} accepted unsafe path ${JSON.stringify(candidate)}`,
      ).toThrow(/must be a file inside the template/)
    }
  })

  it('keeps legitimate dotfiles, nested paths, and dots inside filenames', () => {
    const manifest = validManifest()
    manifest.configs = ['.npmrc', '.changeset/config.json']
    manifest.docs = ['docs/release..notes.md']
    manifest.strip = ['template.json']
    manifest.rename = { 'Dockerfile.standalone': 'Dockerfile' }
    manifest.replacements = [{ file: 'metro.config.js', from: 'old', to: 'new' }]

    expect(parseManifest(manifest)).toMatchObject({
      configs: ['.npmrc', '.changeset/config.json'],
      docs: ['docs/release..notes.md'],
      strip: ['template.json'],
      rename: { 'Dockerfile.standalone': 'Dockerfile' },
      replacements: [{ file: 'metro.config.js', from: 'old', to: 'new' }],
    })
  })
})
