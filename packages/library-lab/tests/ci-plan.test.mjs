import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {planRuntimeChecks, planFromGitBase} from '../scripts/ci-plan.mjs';

const entry = id => `packages/library-lab/entries/${id}-fixture`;
const run = (cwd, args) => {
  const result = spawnSync('git', args, {cwd, encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

test('guide and progress-only changes skip expensive runtime work', () => {
  assert.deepEqual(planRuntimeChecks([
    `${entry('A01')}/guide.md`, 'docs/library-lab/progress/AB.md', 'LIBRARY_CATALOG.md',
  ]), {mode: 'docs-only', run_runtime: 'false', sdk_entries: '', affected: []});
});
test('source changes select only the corresponding real SDK suites', () => {
  assert.deepEqual(planRuntimeChecks([
    `${entry('D03')}/examples/demo.tsx`, `${entry('A01')}/library.json`,
    `${entry('D03')}/tests/sdk.test.mjs`, `${entry('B17')}/agent.md`,
  ]), {mode: 'affected', run_runtime: 'true', sdk_entries: 'A01,D03', affected: ['A01','D03']});
});
test('entry-local unknown paths are treated as runtime until proven documentation', () => {
  const plan = planRuntimeChecks([`${entry('E05')}/lib/worker-bridge.ts`, `${entry('A01')}/verification.json`]);
  assert.deepEqual(plan, {mode: 'affected', run_runtime: 'true', sdk_entries: 'E05', affected: ['E05']});
});
test('public code, package, lock and workflow changes require full verification', () => {
  for (const file of ['packages/library-lab/src/components/demo-host.tsx',
    'packages/library-lab/scripts/sdk-runner.mjs', 'packages/library-lab/e2e/library.spec.ts',
    'packages/library-lab/package.json', 'pnpm-lock.yaml', '.github/workflows/library-lab.yml']) {
    assert.equal(planRuntimeChecks([file]).mode, 'full', file);
    assert.equal(planRuntimeChecks([file]).sdk_entries, '', file);
  }
});
test('invalid or missing git comparison base fails closed to full runtime checks', () => {
  assert.deepEqual(planFromGitBase(''), planRuntimeChecks([], {forceFull: true}));
  assert.equal(planFromGitBase('0'.repeat(40)).mode, 'full');
  assert.equal(planFromGitBase('-dangerous').mode, 'full');
  assert.throws(() => planRuntimeChecks([null]), /Expected/);
});
test('real git rename-free diff preserves targeted plan, not an empty false success', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'lab-ci-plan-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  run(root, ['init', '-q']);
  run(root, ['config', 'user.email', 'test@example.invalid']);
  run(root, ['config', 'user.name', 'Library Lab test']);
  await mkdir(path.join(root, entry('C07')), {recursive: true});
  await writeFile(path.join(root, entry('C07'), 'guide.md'), '# guide\n');
  run(root, ['add', '.']);
  run(root, ['commit', '-qm', 'base']);
  const base = run(root, ['rev-parse', 'HEAD']);
  await mkdir(path.join(root, entry('C07'), 'tests'), {recursive: true});
  await writeFile(path.join(root, entry('C07'), 'tests', 'sdk.test.mjs'), 'export {}\n');
  run(root, ['add', '.']);
  run(root, ['commit', '-qm', 'source']);
  assert.deepEqual(planFromGitBase(base, root), {
    mode: 'affected', run_runtime: 'true', sdk_entries: 'C07', affected: ['C07'],
  });
  assert.equal(planFromGitBase('f'.repeat(40), root).mode, 'full');
});
