import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const workspace = fileURLToPath(new URL('./workspace/', import.meta.url));
const binary = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
for (const [level, rule] of [
  ['basic', null],
  ['business', 'domain-must-not-import-ui'],
  ['advanced', 'no-circular-dependencies'],
]) {
  const result = spawnSync(binary, [
    'exec', 'depcruise', '--config', 'config.cjs',
    '--output-type', 'json', level + '/src',
  ], { cwd: workspace, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.signal, null, 'CLI was interrupted');
  const raw = result.stdout || '';
  assert.ok(raw.trimStart().startsWith('{'), 'Expected actual depcruise JSON reporter output');
  const json = JSON.parse(raw);
  assert.ok(json && typeof json === 'object', 'Reporter must return JSON object');
  if (rule) {
    assert.notEqual(result.status, 0, level + ' must violate ' + rule);
    assert.ok(raw.includes(rule), 'Expected violation ' + rule);
  } else assert.equal(result.status, 0, 'Valid layers must pass');
  process.stdout.write(level + ': actual CLI ' + (rule ? 'expected violation ' + rule : 'clean') + '\n');
}
