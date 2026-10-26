/** Dependency-free consistency contract for the tracked Agent catalogue. */
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GROUPS} from '../src/lib/catalog.mjs';
import {loadEntries} from './find-library.mjs';

export function rootCatalogData(entries) {
  return entries.map(({entryId,name,group,summary,directory,contentState})=>({
    entryId,name,group,summary,path:'packages/library-lab/entries/'+directory,contentState,
  }));
}
export function rootCatalogMarkdown(entries){
  return '# ReactLoom Library Lab\n\n119 条工程知识条目；收录不代表运行验证通过。先读 agent.md，再读真实源码及验证状态。\n\n' +
    '|编号|工具库|用途|组别|目录|\n|---|---|---|---|---|\n' +
    entries.map(e=>'|'+e.entryId+'|'+e.name+'|'+e.summary.replaceAll('|','/')+'|'+GROUPS[e.group]+'|[条目](packages/library-lab/entries/'+e.directory+'/)|').join('\n')+'\n';
}
export function diffRootCatalog(entries,actualJson,actualMarkdown){
  const differences=[];
  const expected=rootCatalogData(entries);
  if(!Array.isArray(actualJson))return ['library-catalog.json must contain an array'];
  const byId=new Map(actualJson.map(e=>[e?.entryId,e]));
  if(byId.size!==actualJson.length)differences.push('duplicate entries in library-catalog.json');
  for(const entry of expected){
    const found=byId.get(entry.entryId);
    if(!found){differences.push('missing '+entry.entryId);continue;}
    for(const key of Object.keys(entry))if(found[key]!==entry[key]){
      differences.push(entry.entryId+' '+key+' is out of date');break;
    }
  }
  if(actualJson.length!==expected.length)differences.push('expected '+expected.length+' catalogue entries; found '+actualJson.length);
  if(actualMarkdown!==rootCatalogMarkdown(entries))differences.push('LIBRARY_CATALOG.md differs from the canonical entry manifests');
  return differences;
}
export async function runRootCatalogAudit(repoRoot=fileURLToPath(new URL('../../..',import.meta.url))){
  const [entries,json,markdown]=await Promise.all([
    loadEntries(path.join(repoRoot,'packages/library-lab/entries')),
    readFile(path.join(repoRoot,'library-catalog.json'),'utf8'),
    readFile(path.join(repoRoot,'LIBRARY_CATALOG.md'),'utf8'),
  ]);
  return {entries:entries.length,differences:diffRootCatalog(entries,JSON.parse(json),markdown)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=await runRootCatalogAudit();
  if(result.differences.length){
    for(const message of result.differences)console.error(message);
    console.error('Refresh tracked indexes with: pnpm --filter @reactloom/library-lab catalog:generate');
    process.exitCode=1;
  }else console.log('Agent index matches '+result.entries+' entry manifests (SDK runtime NOT verified).');
}
