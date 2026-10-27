import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {cleanProject, checkNodeRuntime, inspectProject} from './output-policy.mjs';

const ALLOWED = new Set(['basic', 'business', 'advanced']);
const labRoot = fileURLToPath(new URL('../../..', import.meta.url));
const generatedRoot = fileURLToPath(new URL('./generated/', import.meta.url));
const config = 'entries/F10-orval/examples/orval.config.ts';

function execute(project) {
  // Fixed local pnpm/Orval invocation; no user URL, shell expansion or --clean.
  const args = ['exec', 'orval', '--config', config, '--project', project];
  const result = spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {
    cwd: labRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: 90000,
    maxBuffer: 1024 * 1024,
  });
  if (result.error) throw new Error('Unable to run local pnpm/Orval: ' + result.error.message);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error('Orval command did not succeed (exit=' + result.status +
      ', signal=' + (result.signal ?? 'none') + ')');
  }
}

export async function run(project) {
  if (!ALLOWED.has(project)) throw new Error('Unknown Orval project');
  checkNodeRuntime();
  await cleanProject(generatedRoot, project);
  execute(project);
  const first = await inspectProject(generatedRoot, project);
  // A second real generation protects against nondeterministic or stale artifacts.
  execute(project);
  const second = await inspectProject(generatedRoot, project);
  if (first.sha256 !== second.sha256 || first.count !== second.count) {
    throw new Error('Orval output changed between two identical generations');
  }
  console.log('Orval verified project=' + project + ' files=' + second.count +
    ' sha256=' + second.sha256);
  return second.count;
}
