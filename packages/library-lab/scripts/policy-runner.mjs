/** Offline entry policy tests are not evidence that a third-party SDK was executed. */
import {readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {isSdkSuiteName,parseSdkArguments} from './sdk-runner.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const entryPath=/^entries\/([A-F]\d{2})-[a-z0-9-]+\/(?:examples|tests)\/[^/]+\.test\.m(?:j|t)s$/u;

/** Discover pure JS/TypeScript policy suites without resolving installed npm packages. */
export async function discoverPolicyTests(projectRoot=root){
 const result=[];
 for(const dir of (await readdir(path.join(projectRoot,'entries'),{withFileTypes:true}))
   .filter(item=>item.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))){
  if(!/^[A-F]\d{2}-[a-z0-9-]+$/u.test(dir.name))continue;
  for(const sub of ['examples','tests']){
   let files;
   try{files=await readdir(path.join(projectRoot,'entries',dir.name,sub),{withFileTypes:true});}
   catch(error){if(error.code==='ENOENT')continue;throw error;}
   for(const file of files.filter(item=>item.isFile()&&
      (item.name.endsWith('.test.mjs')||item.name.endsWith('.test.mts'))&&
      !isSdkSuiteName(item.name)).sort((a,b)=>a.name.localeCompare(b.name))){
    result.push('entries/'+dir.name+'/'+sub+'/'+file.name);
   }
  }
 }
 return result;
}
export function selectPolicyTests(files,{entries=null,group=null}={}){
 if(entries!==null&&group!==null)throw new Error('--entries and --group are mutually exclusive');
 if(entries!==null&&(!Array.isArray(entries)||!entries.length||
   entries.some(id=>!/^[A-F]\d{2}$/u.test(id))))throw new Error('Invalid --entries');
 if(group!==null&&!/^[A-F]$/u.test(group))throw new Error('Invalid --group');
 const approved=files.filter(file=>entryPath.test(file)&&!isSdkSuiteName(file.split('/').at(-1)));
 const selected=approved.filter(file=>{
  const [,id]=entryPath.exec(file);
  return (entries===null||entries.includes(id))&&(group===null||id[0]===group);
 });
 if(entries!==null){
  const found=new Set(selected.map(file=>entryPath.exec(file)[1]));
  const missing=entries.filter(id=>!found.has(id));
  if(missing.length)throw new Error('No policy suite for: '+missing.join(', '));
 }
 if(!selected.length)throw new Error('No matching policy suites (this is not SDK verification).');
 return selected;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const selector=parseSdkArguments(process.argv.slice(2));
 const files=selectPolicyTests(await discoverPolicyTests(),selector);
 console.log('Pure entry policy suites selected: '+files.length+' (not SDK evidence)');
 if(selector.list)console.log(files.join('\n'));
 else{
  const result=spawnSync(process.execPath,['--experimental-strip-types','--test',...files],
   {cwd:root,stdio:'inherit'});
  if(result.error)throw result.error;
  process.exitCode=result.status??1;
 }
}
