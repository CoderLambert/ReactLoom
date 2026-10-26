import test from 'node:test';
import assert from 'node:assert/strict';
import {CLI_RECIPES,parseCliSelection,selectedRecipes,executeRecipes} from '../scripts/cli-runner.mjs';
test('fixed registry contains four checked-in CLI verifier recipes',()=>{
 assert.deepEqual(Object.keys(CLI_RECIPES),['F04','F10','F16','F18']);
 assert.deepEqual(selectedRecipes(parseCliSelection(['--entries=F18,F04,F04'])).map(r=>r.id),['F04','F18']);
});
test('unknown targets and injection payloads fail instead of silently passing',()=>{
 for(const bad of ['--entry=F09','--entries=F04,../../tmp','--entry=F04;echo','--group=F','--entry=','--entry=F04/F10'])
  assert.throws(()=>parseCliSelection([bad]),/Invalid|Unsupported|No CLI verifier/);
});
test('list mode reports recipes without starting SDK processes',()=>assert.equal(parseCliSelection(['--list']).list,true));
test('known verifier paths run as Node with shell disabled; a failing real SDK stops the suite',()=>{
 const commands=[];const spawn=(binary,args,opts)=>{commands.push({binary,args,opts});return {status:0,error:null}};
 assert.equal(executeRecipes(selectedRecipes(parseCliSelection(['--entry=F10'])),{cwd:'/fixtures',spawn,stdout:()=>{}}),3);
 for(const {args,opts} of commands){assert.match(args[0],/^entries\\/F10-orval\\/examples\\//);assert.equal(opts.shell,false);assert.equal(opts.cwd,'/fixtures');}
 const failing=(binary,args)=>({status:args[0].includes('business')?1:0,error:null});
 assert.throws(()=>executeRecipes(selectedRecipes(parseCliSelection(['--entry=F10'])),{cwd:'/fixtures',spawn:failing,stdout:()=>{}}),/real verifier failed/);
});
test('tampered registry paths cannot execute arbitrary scripts',()=>{
 assert.throws(()=>executeRecipes([{id:'F04',label:'bad',scripts:['../bad.mjs']}],{spawn:()=>{throw Error('must not run')},stdout:()=>{}}),/Unsafe CLI verifier path/);
});
