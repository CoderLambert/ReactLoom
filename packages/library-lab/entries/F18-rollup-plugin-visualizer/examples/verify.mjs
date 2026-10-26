import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const dir = fileURLToPath(new URL('.', import.meta.url));
const lab = path.resolve(dir, '../../../');
const config = path.join(dir, 'vite.config.ts');
const binary = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const suffix = { basic: '.html', business: '.md', advanced: '.json' };
for (const level of Object.keys(suffix)) {
  const result = spawnSync(binary, ['exec','vite','build','--config',config,'--mode',level],
    { cwd: lab, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, level + ' real Vite build failed: ' + (result.stderr || result.stdout));
  const report = path.join(dir, 'reports', level + suffix[level]);
  const info = await stat(report);
  assert.ok(info.size > 100, 'Expected an actual nonempty report: ' + level);
  const text = await readFile(report, 'utf8');
  if (level === 'basic') assert.match(text, /<html/i);
  if (level === 'advanced') {
    const raw = JSON.parse(text);
    assert.ok(raw !== null && typeof raw === 'object', 'Expected real raw-data JSON');
    const output = await readdir(path.join(dir, 'reports', 'dist-' + level, 'assets'));
    assert.ok(output.filter(name => name.endsWith('.js')).length >= 2, 'Dynamic import should produce a separate JS chunk');
  }
  process.stdout.write(level + ': build exit 0; report ' + info.size + ' bytes\n');
}
