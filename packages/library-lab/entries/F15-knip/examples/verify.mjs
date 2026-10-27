import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { checkKnipReport } from './report-policy.mjs';

const lab = fileURLToPath(new URL('../../../', import.meta.url));
const fixture = path.join('entries','F15-knip','examples','workspace');
const binary = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
for (const level of ['basic','business','advanced']) {
  const args = ['exec','knip','--directory',fixture,'--config','knip.'+level+'.json','--reporter','json'];
  if (level === 'advanced') args.push('--production');
  const run = spawnSync(binary,args,{cwd:lab,encoding:'utf8',maxBuffer:2_000_000,timeout:60_000,windowsHide:true});
  if (run.error || run.signal) throw Error('Knip unavailable/terminated: '+String(run.error ?? run.signal));
  let summary;
  try { summary = checkKnipReport(level,run.status,run.stdout); }
  catch (error) { process.stderr.write(level+' stderr: '+(run.stderr||'')+'\n'); throw error; }
  process.stdout.write(level+': real Knip exit='+run.status+', findings='+summary.count+', unused='+summary.orphan+'\n');
}
