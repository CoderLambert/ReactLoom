import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import * as pagefind from 'pagefind'
import { assertPublicDocument, escapeHtmlText } from './publication-policy.mjs'

const LEVELS = new Set(['basic', 'business', 'advanced'])
const pages = [
  {
    visibility: 'public',
    url: '/articles/react-suspense/',
    title: 'React Suspense',
    content: 'Rendering async interfaces with a clear loading boundary',
  },
  {
    visibility: 'public',
    url: '/articles/cache-design/',
    title: 'Cache ownership',
    content: 'Cache invalidation and data versioning for RSS readers',
  },
  {
    visibility: 'public',
    url: '/articles/agent-notes/',
    title: 'Agent engineering notes',
    content: 'A static knowledge base with reusable examples',
  },
]

function documentHTML(title, content) {
  // Deliberately static trusted fixture. Do not put unescaped user HTML here.
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' +
    escapeHtmlText(title) +
    '</title></head><body><main data-pagefind-body><h1>' +
    escapeHtmlText(title) +
    '</h1><p>' +
    escapeHtmlText(content) +
    '</p></main></body></html>'
  )
}
function ensureNoErrors(result, action) {
  if (!result || (result.errors !== undefined && !Array.isArray(result.errors)))
    throw new Error(`Unexpected Pagefind response from ${action}`)
  if (result.errors?.length) throw new Error(`${action}: ${result.errors.join('; ')}`)
  return result
}
export async function runWorkshop(level, { keepOutput = false } = {}) {
  if (!LEVELS.has(level)) throw new Error('Invalid Pagefind workshop level')
  const scratch = await mkdtemp(path.join(tmpdir(), 'reactloom-pagefind-'))
  const site = path.join(scratch, 'trusted-static-html')
  const bundle = path.join(scratch, 'out', 'pagefind')
  let index
  let complete = false
  const indexedDocuments = []
  let directoryPages = 0
  try {
    await mkdir(site, { recursive: true })
    const created = ensureNoErrors(
      await pagefind.createIndex({
        forceLanguage: 'en',
        excludeSelectors: ['[data-sensitive]'],
      }),
      'createIndex',
    )
    index = created.index
    if (!index) throw new Error('Pagefind binary did not return an index')
    for (const doc of pages.slice(0, level === 'basic' ? 2 : 3)) {
      const publicDoc = assertPublicDocument(doc)
      const added = ensureNoErrors(
        await index.addHTMLFile({
          url: publicDoc.url,
          content: documentHTML(publicDoc.title, publicDoc.content),
        }),
        'addHTMLFile',
      )
      indexedDocuments.push({ url: added.file.url, meta: added.file.meta })
    }
    if (level !== 'basic') {
      const note = assertPublicDocument({
        visibility: 'public',
        url: '/files/rss-playbook.txt',
        title: 'RSS field notes',
        content: 'Offline RSS sync, query ownership, retries and idempotency',
      })
      const added = ensureNoErrors(
        await index.addCustomRecord({
          url: note.url,
          content: note.content,
          language: 'en',
          meta: { title: 'RSS field notes', category: 'guide' },
          filters: { category: ['guide'], tags: ['rss', 'offline'] },
        }),
        'addCustomRecord',
      )
      indexedDocuments.push({ url: added.file.url, meta: added.file.meta })
    }
    if (level === 'advanced') {
      await writeFile(
        path.join(site, 'static.html'),
        documentHTML('Static documentation', 'Full text search generated during a static build'),
      )
      const scanned = ensureNoErrors(await index.addDirectory({ path: site }), 'addDirectory')
      directoryPages = scanned.page_count
    }
    const { files } = ensureNoErrors(await index.getFiles(), 'getFiles')
    if (!Array.isArray(files) || !files.length) throw new Error('Pagefind returned no bundle files')
    if (files.some((file) => !file.path || !file.content?.byteLength))
      throw new Error('Pagefind returned an empty asset')
    await mkdir(path.dirname(bundle), { recursive: true })
    ensureNoErrors(await index.writeFiles({ outputPath: bundle }), 'writeFiles')
    const memoryBundleBytes = files.reduce((sum, file) => sum + file.content.byteLength, 0)
    const written = await stat(bundle)
    if (!written.isDirectory()) throw new Error('Pagefind output was not a directory')
    // getFiles and writeFiles are distinct generations; hashed filenames may differ.
    // Inspect the actual written generation instead of assuming byte identity.
    const assets = []
    for (const relative of (await readdir(bundle, { recursive: true })).sort()) {
      const target = path.resolve(bundle, relative)
      if (!target.startsWith(bundle + path.sep)) throw new Error('Pagefind asset escapes bundle')
      if (!(await stat(target)).isFile()) continue
      const actual = await readFile(target)
      if (!actual.byteLength) throw new Error('Pagefind wrote empty asset')
      assets.push({
        path: relative,
        bytes: actual.byteLength,
        sha256: createHash('sha256').update(actual).digest('hex'),
      })
    }
    if (!assets.length) throw new Error('Pagefind wrote no assets')
    const bundleBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0)
    complete = true
    return {
      level,
      indexer: 'pagefind Node API',
      submittedRecords: level === 'basic' ? 2 : level === 'business' ? 4 : 5,
      fileCount: assets.length,
      bundleBytes,
      assets,
      indexedDocuments,
      directoryPages,
      memoryFileCount: files.length,
      memoryBundleBytes,
      paths: assets.map((file) => file.path).sort(),
      wroteActualBundle: true,
      outputDirectory: keepOutput ? bundle : null,
      visitorSearchExecuted: false,
    }
  } finally {
    let deleted = false
    try {
      if (index) await index.deleteIndex()
      deleted = true
    } finally {
      if (!keepOutput || !complete || !deleted) await rm(scratch, { recursive: true, force: true })
    }
  }
}
