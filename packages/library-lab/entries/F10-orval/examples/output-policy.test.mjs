import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {checkNodeRuntime, projectPaths, cleanProject, inspectProject} from './output-policy.mjs';

const operations = ['listSources', 'createSource', 'getSource'];
const generated = operations.map(name => 'export const ' + name + ' = async () => ({ok:true});').join('\n');
const hooks = ['useListSources', 'useCreateSource', 'useGetSource']
  .map(name => 'export const ' + name + ' = () => ({data:null});').join('\n');

async function withRoot(run) {
  const root = await mkdtemp(path.join(tmpdir(), 'reactloom-orval-'));
  try { return await run(root); }
  finally { await rm(root, {recursive: true, force: true}); }
}

test('Orval Node floor is checked without executing CLI', () => {
  assert.throws(() => checkNodeRuntime('22.16.0'), /22\.18/);
  assert.throws(() => checkNodeRuntime('v22.18.0'), /22\.18/);
  checkNodeRuntime('22.18.0');
  checkNodeRuntime('24.0.0');
  assert.deepEqual(projectPaths('advanced'), ['advanced.ts', 'advanced', 'advanced-models']);
  assert.throws(() => projectPaths('../unsafe'), /Unknown/);
});

test('empty and stale-looking files do not count as generated success', async () => withRoot(async root => {
  await assert.rejects(inspectProject(root, 'basic'), /empty/);
  await writeFile(path.join(root, 'basic.ts'), 'export const listSources = 1');
  await assert.rejects(inspectProject(root, 'basic'), /Missing generated operation/);
  await writeFile(path.join(root, 'basic.ts'), generated);
  assert.equal((await inspectProject(root, 'basic')).count, 1);
  const before = (await inspectProject(root, 'basic')).sha256;
  await writeFile(path.join(root, 'basic.ts'), generated + '\n// changed');
  assert.notEqual((await inspectProject(root, 'basic')).sha256, before);
}));

test('business requires actual query hook exports, not just fetch operations', async () => withRoot(async root => {
  await writeFile(path.join(root, 'business.ts'), generated);
  await assert.rejects(inspectProject(root, 'business'), /Missing generated React Query hook/);
  await writeFile(path.join(root, 'business.ts'), generated + '\n' + hooks);
  assert.equal((await inspectProject(root, 'business')).count, 1);
}));

test('advanced needs split tag output and catches unexpected artifacts', async () => withRoot(async root => {
  await writeFile(path.join(root, 'advanced.ts'), generated);
  await assert.rejects(inspectProject(root, 'advanced'), /tag directories/);
  await mkdir(path.join(root, 'advanced', 'sources'), {recursive: true});
  await writeFile(path.join(root, 'advanced', 'sources', 'sources.ts'), generated);
  assert.equal((await inspectProject(root, 'advanced')).count, 2);
  await writeFile(path.join(root, 'advanced', 'sources', 'unsafe.js'), 'unknown');
  await assert.rejects(inspectProject(root, 'advanced'), /Unexpected generated file/);
}));

test('only fixed project outputs are cleaned; sibling generated files survive', async () => withRoot(async root => {
  await writeFile(path.join(root, 'basic.ts'), generated);
  await writeFile(path.join(root, 'business.ts'), generated + hooks);
  await mkdir(path.join(root, 'basic-models'));
  await writeFile(path.join(root, 'basic-models', 'source.ts'), 'export type Source = {}');
  await cleanProject(root, 'basic');
  assert.deepEqual((await readdir(root)).sort(), ['business.ts']);
  assert.match(await readFile(path.join(root, 'business.ts'), 'utf8'), /useGetSource/);
}));

test('symlinks and oversized output are rejected before claiming CLI success', async () => withRoot(async root => {
  const external = await mkdtemp(path.join(tmpdir(), 'reactloom-orval-external-'));
  try {
    await writeFile(path.join(external, 'secrets.ts'), generated);
    await symlink(external, path.join(root, 'basic-models'), 'dir');
    await assert.rejects(cleanProject(root, 'basic'), /symlink/);
    await assert.rejects(inspectProject(root, 'basic'), /symlink/);
  } finally { await rm(external, {recursive: true, force: true}); }
}));
