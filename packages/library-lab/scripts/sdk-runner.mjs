import {readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('..',import.meta.url));
/** Discover real entry node:test suites, rather than keeping a stale hardcoded list. */
export async function discoverSdkTests(projectRoot=root){
 const files=['tests/sdk.test.mjs'];
 const entries=path.join(projectRoot,'entries');
 for(const dir of (await readdir(entries,{withFileTypes:true})).filter(v=>v.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))){
  let tests;
  try{tests=await readdir(path.join(entries,dir.name,'tests'),{withFileTypes:true});}
  catch(error){if(error.code==='ENOENT')continue;throw error;}
  for(const f of tests.filter(v=>v.isFile()&&v.name.endsWith('.test.mjs')).sort((a,b)=>a.name.localeCompare(b.name)))
   files.push(`entries/${dir.name}/tests/${f.name}`);
 }
 return files;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const files=await discoverSdkTests();console.log(`Running real SDK node:test suites: ${files.length} files`);
 const result=spawnSync(process.execPath,['--test',...files],{cwd:root,stdio:'inherit'});
 if(result.error)throw result.error;process.exitCode=result.status??1;
}
