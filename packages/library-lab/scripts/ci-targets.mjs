/** Run only the SDK/browser targets selected by ci-scope. Missing coverage is an error. */
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
export function targetCommands(plan,kind){
 if(!plan||typeof plan.runtime!=='boolean'||typeof plan.all!=='boolean'||!Array.isArray(plan.entries)||
    plan.entries.some(id=>!/^[A-F]\d{2}$/u.test(id))||!['sdk','browser'].includes(kind))throw new Error('Invalid CI scope');
 if(!plan.runtime)return [];
 if(!plan.all&&!plan.entries.length)throw new Error('Empty runtime selection is not PASS');
 if(kind==='browser')return plan.all?[['pnpm','exec','playwright','test']]:
  plan.entries.map(id=>['pnpm','exec','playwright','test','--grep',`@${id}\\b`]);
 if(plan.all)return [['pnpm','test:sdk'],['pnpm','test:vitest']];
 const nodeEntries=plan.entries.filter(id=>id!=='F12');
 return [...(nodeEntries.length?[['node','scripts/sdk-runner.mjs',`--entries=${nodeEntries.join(',')}`]]:[]),
  ...(plan.entries.includes('F12')?[['pnpm','test:vitest']]:[])];
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const kind=process.argv[2];
 const plan=JSON.parse(await readFile(path.join(root,'ci-scope.json'),'utf8'));
 for(const [command,...args] of targetCommands(plan,kind)){
  if(command==='node'&&args[0]==='scripts/sdk-runner.mjs'){
   // A missing suite must not silently fall back to unrelated policy tests.
   const {discoverSdkTests,selectSdkTests}=await import('./sdk-runner.mjs');
   selectSdkTests(await discoverSdkTests(root),{entries:plan.entries.filter(id=>id!=='F12')});
  }
  const result=spawnSync(command==='node'?process.execPath:command,args,{cwd:root,stdio:'inherit',shell:false});
  if(result.error)throw result.error;
  if(result.status!==0){process.exitCode=result.status??1;break;}
 }
}
