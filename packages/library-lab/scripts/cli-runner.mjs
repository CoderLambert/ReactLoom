/** Fixed, offline CLI workshop registry. No paths, executables or shell provided by the caller. */
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export const CLI_RECIPES=Object.freeze({
 F04:{label:'ExcelJS workbook round trip',scripts:['entries/F04-exceljs/examples/verify.mjs']},
 F10:{label:'Orval generated client variants',scripts:['entries/F10-orval/examples/basic.mjs','entries/F10-orval/examples/business.mjs','entries/F10-orval/examples/advanced.mjs']},
 F16:{label:'dependency-cruiser architecture rules',scripts:['entries/F16-dependency-cruiser/examples/verify.mjs']},
 F18:{label:'rollup-plugin-visualizer real Vite reports',scripts:['entries/F18-rollup-plugin-visualizer/examples/verify.mjs']},
});
const PATTERN=/^[A-F]\d{2}$/u;
export function parseCliSelection(args=[]){
 let list=false;const ids=new Set();
 for(const arg of args){
  if(arg==='--list'){list=true;continue;}
  if(arg.startsWith('--entry=')||arg.startsWith('--entries=')){
   const values=arg.slice(arg.indexOf('=')+1).split(',');
   if(values.some(value=>!PATTERN.test(value)))throw new Error('Invalid CLI entry selector');
   for(const id of values)ids.add(id);
   continue;
  }
  throw new Error(`Unsupported CLI runner argument: ${arg}`);
 }
 for(const id of ids)if(!Object.hasOwn(CLI_RECIPES,id))throw new Error(`No CLI verifier for ${id}; cannot claim PASS`);
 return {list,ids:[...ids].sort()};
}
export function selectedRecipes(parsed,registry=CLI_RECIPES){
 const ids=parsed.ids.length?parsed.ids:Object.keys(registry).sort();
 return ids.map(id=>({id,...registry[id]}));
}
export function executeRecipes(recipes,{cwd=root,spawn=spawnSync,stdout=console.log}={}){
 let commands=0;
 for(const {id,label,scripts} of recipes){
  stdout(`Running actual ${id}: ${label}`);
  for(const script of scripts){
   if(!/^entries\/[A-F]\d{2}-[a-z0-9-]+\/examples\/[a-z0-9-]+\.mjs$/u.test(script)||!script.startsWith(`entries/${id}-`))
    throw new Error(`Unsafe CLI verifier path for ${id}`);
   const result=spawn(process.execPath,[script],{cwd,stdio:'inherit',shell:false,timeout:180_000});
   if(result.error)throw result.error;
   if(result.status!==0)throw new Error(`${id} real verifier failed: ${script} (exit ${result.status??'signal'})`);
   commands++;
  }
 }
 stdout(`Completed ${commands} real CLI commands; only those commands have runtime evidence.`);
 return commands;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const parsed=parseCliSelection(process.argv.slice(2));const recipes=selectedRecipes(parsed);
  if(parsed.list)console.log(recipes.map(({id,label,scripts})=>`${id} ${label}\n  ${scripts.join('\n  ')}`).join('\n'));
  else executeRecipes(recipes);
 }catch(error){console.error(String(error));process.exitCode=1;}
}
