import * as pagefind from 'pagefind';
import {assertPublicDocument, escapeHtmlText} from './publication-policy.mjs';
import {mkdtemp, mkdir, writeFile, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const LEVELS = new Set(['basic', 'business', 'advanced']);
const pages = [
  {visibility: 'public', url: '/articles/react-suspense/', title: 'React Suspense', content: 'Rendering async interfaces with a clear loading boundary'},
  {visibility: 'public', url: '/articles/cache-design/', title: 'Cache ownership', content: 'Cache invalidation and data versioning for RSS readers'},
  {visibility: 'public', url: '/articles/agent-notes/', title: 'Agent engineering notes', content: 'A static knowledge base with reusable examples'},
];

function documentHTML(title, content) {
  // Deliberately static trusted fixture. Do not put unescaped user HTML here.
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' +
    escapeHtmlText(title) + '</title></head><body><main data-pagefind-body><h1>' + escapeHtmlText(title) +
    '</h1><p>' + escapeHtmlText(content) + '</p></main></body></html>';
}
function ensureNoErrors(result, action) {
  if (!result || (result.errors !== undefined && !Array.isArray(result.errors))) throw new Error('Unexpected Pagefind response from ' + action);
  if (result.errors?.length) throw new Error(action + ': ' + result.errors.join('; '));
  return result;
}
export async function runWorkshop(level, {keepOutput = false} = {}) {
  if (!LEVELS.has(level)) throw new Error('Invalid Pagefind workshop level');
  const scratch = await mkdtemp(path.join(tmpdir(), 'reactloom-pagefind-'));
  const site = path.join(scratch, 'trusted-static-html');
  const bundle = path.join(scratch, 'out', 'pagefind');
  let index;
  try {
    await mkdir(site, {recursive: true});
    const created = ensureNoErrors(await pagefind.createIndex({
      forceLanguage: 'en',
      excludeSelectors: ['[data-sensitive]'],
    }), 'createIndex');
    index = created.index;
    if (!index) throw new Error('Pagefind binary did not return an index');
    for (const doc of pages.slice(0, level === 'basic' ? 2 : 3)) {
      const publicDoc = assertPublicDocument(doc);
      ensureNoErrors(await index.addHTMLFile({
        url: publicDoc.url,
        content: documentHTML(publicDoc.title, publicDoc.content),
      }), 'addHTMLFile');
    }
    if (level !== 'basic') {
      const note = assertPublicDocument({visibility: 'public', url: '/files/rss-playbook.txt',
        title: 'RSS field notes', content: 'Offline RSS sync, query ownership, retries and idempotency'});
      ensureNoErrors(await index.addCustomRecord({
        url: note.url,
        content: note.content,
        language: 'en',
        meta: {title: 'RSS field notes', category: 'guide'},
        filters: {category: ['guide'], tags: ['rss', 'offline']},
      }), 'addCustomRecord');
    }
    if (level === 'advanced') {
      await writeFile(path.join(site, 'static.html'), documentHTML(
        'Static documentation', 'Full text search generated during a static build'));
      ensureNoErrors(await index.addDirectory({path: site}), 'addDirectory');
    }
    const {files} = ensureNoErrors(await index.getFiles(), 'getFiles');
    if (!Array.isArray(files) || !files.length) throw new Error('Pagefind returned no bundle files');
    if (files.some(file => !file.path || !file.content?.byteLength))
      throw new Error('Pagefind returned an empty asset');
    await mkdir(path.dirname(bundle), {recursive: true});
    ensureNoErrors(await index.writeFiles({outputPath: bundle}), 'writeFiles');
    const bundleBytes = files.reduce((sum, file) => sum + file.content.byteLength, 0);
    const written = await stat(bundle);
    if (!written.isDirectory()) throw new Error('Pagefind output was not a directory');
    return {
      level, indexer: 'pagefind Node API', submittedRecords: level === 'basic' ? 2 : level === 'business' ? 4 : 5,
      fileCount: files.length, bundleBytes,
      paths: files.map(file => file.path).sort(),
      wroteActualBundle: true, outputDirectory: keepOutput ? bundle : null,
      visitorSearchExecuted: false,
    };
  } finally {
    try {
      if (index) await index.deleteIndex();
    } finally {
      if (!keepOutput) await rm(scratch, {recursive: true, force: true});
    }
  }
}
