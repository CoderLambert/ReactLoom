import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {verifyProject} from './verify.mjs';

const ALLOWED=new Set(['basic','business','advanced']);
const labRoot=fileURLToPath(new URL('../../..',import.meta.url));
export function run(project){
  if(!ALLOWED.has(project))throw new Error('unknown project');
  // Fixed CLI args: never accept arbitrary shell or a remote OpenAPI URL.
  const cli=process.platform==='win32'?'orval.cmd':'orval';
  const result=spawnSync(cli,['--config','entries/F10-orval/examples/orval.config.ts','--project',project],{
    cwd:labRoot,encoding:'utf8',shell:false,timeout:90000,maxBuffer:1024*1024
  });
  if(result.error)throw result.error;
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  if(result.status!==0)throw new Error('Orval generation exited with '+result.status);
  return verifyProject(project);
}
