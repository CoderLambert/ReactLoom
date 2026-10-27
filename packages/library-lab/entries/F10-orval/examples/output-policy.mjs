import {lstat, mkdir, readFile, readdir, rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const PROJECTS = Object.freeze({
  basic: ['basic.ts', 'basic-models'],
  business: ['business.ts', 'business-models'],
  advanced: ['advanced.ts', 'advanced', 'advanced-models'],
});
const OPERATIONS = ['listSources', 'createSource', 'getSource'];
const MAX_FILES = 128;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_TOTAL_BYTES = 6 * 1024 * 1024;

export function checkNodeRuntime(version = process.versions.node) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match || Number(match[1]) < 22 ||
      (Number(match[1]) === 22 && Number(match[2]) < 18)) {
    throw new Error('Orval 8 requires Node >=22.18; current version: ' + version);
  }
}

export function projectPaths(project) {
  if (!Object.hasOwn(PROJECTS, project)) throw new Error('Unknown Orval project');
  return [...PROJECTS[project]];
}

async function safeType(filename) {
  const item = await lstat(filename).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (item?.isSymbolicLink()) throw new Error('Refusing generated symlink: ' + filename);
  if (item && !item.isFile() && !item.isDirectory()) {
    throw new Error('Unexpected generated node: ' + filename);
  }
  return item;
}

export async function cleanProject(root, project) {
  const rootItem = await safeType(root);
  if (rootItem && !rootItem.isDirectory()) throw new Error('Generated root is not a directory');
  if (!rootItem) await mkdir(root, {recursive: true});
  for (const part of projectPaths(project)) {
    const target = path.join(root, part);
    if (await safeType(target)) await rm(target, {recursive: true, force: false});
  }
}

export async function inspectProject(root, project) {
  const parts = projectPaths(project);
  const info = await safeType(root);
  if (!info?.isDirectory()) throw new Error('Generated root is missing');
  const files = [];
  let total = 0;

  async function visit(filename, relative, depth) {
    if (depth > 8) throw new Error('Generated folder nesting exceeded limit');
    const entry = await safeType(filename);
    if (!entry) return;
    if (entry.isDirectory()) {
      for (const name of (await readdir(filename)).sort()) {
        if (name === '.' || name === '..') throw new Error('Invalid output filename');
        await visit(path.join(filename, name), relative ? relative + '/' + name : name, depth + 1);
      }
      return;
    }
    if (!/\.tsx?$/u.test(relative)) throw new Error('Unexpected generated file: ' + relative);
    if (entry.size > MAX_FILE_BYTES) throw new Error('Generated file exceeds 1MiB: ' + relative);
    if (++total > MAX_FILES) throw new Error('Too many generated files');
    files.push({filename, relative, size: entry.size});
  }

  for (const part of parts) await visit(path.join(root, part), part, 0);
  if (!files.length) throw new Error('Orval output is empty: ' + project);
  if (project !== 'advanced' && !files.some(file => file.relative === project + '.ts')) {
    throw new Error('Orval main output is missing: ' + project + '.ts');
  }
  if (project === 'advanced' && !files.some(file => file.relative.startsWith('advanced/'))) {
    throw new Error('Orval tags-split output must contain tag directories');
  }

  const digest = createHash('sha256');
  const sources = [];
  let bytes = 0;
  for (const file of files.sort((a, b) => a.relative.localeCompare(b.relative))) {
    bytes += file.size;
    if (bytes > MAX_TOTAL_BYTES) throw new Error('Generated project exceeds 6MiB');
    const code = await readFile(file.filename, 'utf8');
    sources.push(code);
    digest.update(file.relative + '\0' + code + '\0');
  }
  const combined = sources.join('\n');
  for (const operation of OPERATIONS) {
    const exported = new RegExp('\\bexport\\s+(?:(?:declare\\s+)?(?:const|function)|async\\s+function)\\s+' + operation + '\\b', 'u');
    if (!exported.test(combined)) throw new Error('Missing generated operation: ' + operation);
  }
  if (project === 'business') {
    for (const hook of ['useListSources', 'useCreateSource', 'useGetSource']) {
      if (!new RegExp('\\bexport\\s+(?:const|function)\\s+' + hook + '\\b', 'u').test(combined)) {
        throw new Error('Missing generated React Query hook: ' + hook);
      }
    }
  }
  return {count: files.length, bytes, sha256: digest.digest('hex'), files: files.map(file => file.relative)};
}
