/** Plan only the Library Lab checks affected by a Git diff.
 * This file has no npm dependencies so it can run before the bootstrap install.
 * A missing or unusable comparison base fails safe to full runtime verification.
 */
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const ENTRY_SOURCE = /^packages\/library-lab\/entries\/([A-F]\d{2})-[a-z0-9-]+\/(?:library\.json$|examples\/|tests\/|assets\/)/u;
const SHARED_RUNTIME = /^(?:package\.json$|pnpm-lock\.yaml$|pnpm-workspace\.yaml$|\.github\/workflows\/(?:library-lab|ci)\.yml$|packages\/library-lab\/(?:package\.json$|src\/|scripts\/|tests\/|e2e\/|public\/|tsconfig\.|vite\.config\.|playwright\.config\.))/u;

export function planRuntimeChecks(changedPaths, {forceFull = false} = {}) {
  if (!Array.isArray(changedPaths) || changedPaths.some(p => typeof p !== 'string')) {
    throw new TypeError('Expected a list of changed file paths');
  }
  const entries = new Set();
  let full = forceFull;
  for (const file of changedPaths) {
    if (SHARED_RUNTIME.test(file)) full = true;
    const match = ENTRY_SOURCE.exec(file);
    if (match) entries.add(match[1]);
  }
  const affected = [...entries].sort();
  return {
    mode: full ? 'full' : affected.length ? 'affected' : 'docs-only',
    run_runtime: full || affected.length > 0 ? 'true' : 'false',
    sdk_entries: full ? '' : affected.join(','),
    affected,
  };
}

export function planFromGitBase(base, root = repositoryRoot) {
  // Never allow arbitrary git revision flags or a shell to enter the comparison.
  if (!/^[0-9a-f]{40}$/u.test(base) || /^0{40}$/u.test(base)) return planRuntimeChecks([], {forceFull: true});
  const compared = spawnSync('git', ['diff', '--no-renames', '--name-only', '-z', base, 'HEAD'], {
    cwd: root, shell: false, encoding: 'buffer', maxBuffer: 4 * 1024 * 1024,
  });
  if (compared.error || compared.status !== 0) return planRuntimeChecks([], {forceFull: true});
  return planRuntimeChecks(Buffer.from(compared.stdout).toString('utf8').split('\0').filter(Boolean));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !args[0].startsWith('--base=')) {
    console.error('Usage: node scripts/ci-plan.mjs --base=<40-character SHA>');
    process.exitCode = 2;
  } else {
    const plan = planFromGitBase(args[0].slice('--base='.length));
    // Only these plain-value lines are intended for GITHUB_OUTPUT.
    console.log(`run_runtime=${plan.run_runtime}`);
    console.log(`sdk_entries=${plan.sdk_entries}`);
    console.log(`plan_mode=${plan.mode}`);
  }
}
