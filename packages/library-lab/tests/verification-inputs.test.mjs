import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';

test('verification fingerprint changes for lock, host, config and undisplayed test changes, not docs',async t=>{
 let module;
 try{module=await import('../scripts/verification-inputs.mjs');}catch{}
 assert.equal(typeof module?.sharedInputsFingerprint,'function');
 const repo=await mkdtemp(path.join(tmpdir(),'lab-inputs-'));
 t.after(()=>rm(repo,{recursive:true,force:true}));
 const root=path.join(repo,'packages/library-lab'),folder=path.join(root,'entries/D03-p-limit');
 const put=async(relative,text)=>{await mkdir(path.dirname(path.join(repo,relative)),{recursive:true});await writeFile(path.join(repo,relative),text);};
 await put('packages/library-lab/src/host.ts','one');
 await put('packages/library-lab/entries/D03-p-limit/examples/main.ts','one');
 const current=async()=>module.entryInputsFingerprint(folder,await module.sharedInputsFingerprint(root));
 let before=await current();
 for(const name of ['pnpm-lock.yaml','packages/library-lab/src/host.ts','packages/library-lab/vite.config.ts','packages/library-lab/entries/D03-p-limit/tests/actual-sdk.mjs']){
  await put(name,'changed'); const after=await current();assert.notEqual(after,before,name);before=after;
 }
 await put('packages/library-lab/entries/D03-p-limit/guide.md','docs only');
 await put('packages/library-lab/entries/D03-p-limit/verification.json','receipt metadata');
 await put('packages/library-lab/src/generated/loaders.ts','derived output');
 assert.equal(await current(),before);
});
