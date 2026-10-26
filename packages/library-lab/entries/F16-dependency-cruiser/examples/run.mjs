import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const level = process.argv[2] ?? 'basic';
if (!['basic', 'business', 'advanced'].includes(level)) {
  process.stderr.write('Usage: node examples/run.mjs basic|business|advanced\n');
  process.exit(2);
}
const workspace = fileURLToPath(new URL('./workspace/', import.meta.url));
const binary = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const args = ['exec', 'depcruise', '--config', 'config.cjs', '--output-type', 'json', path.join(level, 'src')];
const run = spawnSync(binary, args, { cwd: workspace, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
if (run.error) {
  process.stderr.write('无法启动依赖检查工具：' + String(run.error) + '\n');
  process.exit(2);
}
process.stdout.write(run.stdout ?? '');
process.stderr.write(run.stderr ?? '');
process.stderr.write('\n实际depcruise退出码：' + run.status + '；basic预期0，业务/边界反例预期非0。\n');
process.exit(run.status ?? 2);
