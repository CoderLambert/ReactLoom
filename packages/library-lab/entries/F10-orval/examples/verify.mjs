import {readdir,stat,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('./generated/',import.meta.url));
const expected=new Map([['basic','basic.ts'],['business','business.ts'],['advanced','advanced']]);
export async function verifyProject(project){
  const basename=expected.get(project);if(!basename)throw new Error('unknown project');
  const target=path.resolve(root,basename);
  // Advanced tags-split may create a directory or several files with a shared stem.
  let files=[];
  if(project==='advanced'){
    files=(await readdir(root)).filter(name=>name.startsWith('advanced')).map(name=>path.join(root,name));
    files=files.filter(async()=>true);
  }else{files=[target]}
  let found=0;
  for(const f of files){
    const info=await stat(f).catch(()=>null);
    if(!info)continue;
    if(info.isFile()){if(info.size>20)found++;}
    else if(info.isDirectory()){
      const children=await readdir(f,{recursive:true});
      if(children.some(name=>name.endsWith('.ts')))found++;
    }
  }
  if(found===0)throw new Error('Orval did not produce expected '+project+' outputs');
  return found;
}
