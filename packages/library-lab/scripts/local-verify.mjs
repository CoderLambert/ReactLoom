/** Explicit, reproducible LOCAL verification. Never invoked by the demo UI. */
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=fileURLToPath(new URL('../../../',import.meta.url));
const LAB='@reactloom/library-lab';
const ID=/^[A-F]\d{2}$/u;
const MAX_LOG_BYTES=24*1024*1024;

export function parseOptions(argv=[]) {
 const out={execute:false,resolveLock:false,sdk:false,browser:false,setupBrowser:false,sdkEntry:null};
 const seen=new Set();
 for(const arg of argv){
  if(seen.has(arg))throw new Error('Duplicate option: '+arg);
  seen.add(arg);
  if(arg==='--execute')out.execute=true;
  else if(arg==='--resolve-lock')out.resolveLock=true;
  else if(arg==='--sdk')out.sdk=true;
  else if(arg==='--browser')out.browser=true;
  else if(arg==='--setup-browser')out.setupBrowser=true;
  else if(arg.startsWith('--sdk-entry=')) {
   const id=arg.slice('--sdk-entry='.length);
   if(!ID.test(id)||out.sdkEntry)throw new Error('Invalid or duplicate --sdk-entry');
   out.sdkEntry=id;
  } else if(arg!=='--plan')throw new Error('Unknown option: '+arg);
 }
 if(out.execute&&seen.has('--plan'))throw new Error('Choose either --plan or --execute');
 if(!out.execute&&(out.resolveLock||out.sdk||out.browser||out.setupBrowser||out.sdkEntry))
  throw new Error('Execution options require --execute');
 if(out.setupBrowser&&!out.browser)throw new Error('--setup-browser requires --browser');
 if(out.sdk&&out.sdkEntry)throw new Error('Choose --sdk or --sdk-entry, not both');
 return out;
}

export function verificationSteps(options={}) {
 const steps=[];
 if(options.resolveLock)steps.push({name:'resolve-lock',command:'pnpm',args:['install','--lockfile-only','--no-frozen-lockfile']});
 steps.push({name:'frozen-install',command:'pnpm',args:['install','--frozen-lockfile']});
 for(const [name,script] of [['catalog','catalog:check'],['policy','test'],['typecheck','typecheck'],['production-build','build']])
  steps.push({name,command:'pnpm',args:['--filter',LAB,script]});
 if(options.sdk)steps.push({name:'all-node-sdk',command:'pnpm',args:['--filter',LAB,'test:sdk']});
 if(options.sdkEntry)steps.push({name:'selected-node-sdk',command:'pnpm',args:['--filter',LAB,'exec','node','scripts/sdk-runner.mjs',`--entry=${options.sdkEntry}`]});
 if(options.setupBrowser)steps.push({name:'chromium-setup',command:'pnpm',args:['--filter',LAB,'test:e2e:setup']});
 if(options.browser)steps.push({name:'browser-e2e',command:'pnpm',args:['--filter',LAB,'test:e2e']});
 return steps;
}

export function isSupportedNode(version) {
 const [major,minor]=String(version).replace(/^v/u,'').split('.').map(Number);
 return Number.isInteger(major)&&Number.isInteger(minor)&&(major>22||(major===22&&minor>=18));
}

function tool(command,args,cwd=ROOT){return spawnSync(command,args,{cwd,encoding:'utf8',shell:false,timeout:30_000,maxBuffer:MAX_LOG_BYTES});}
function lockDigest(root=ROOT){const file=path.join(root,'pnpm-lock.yaml');return existsSync(file)?createHash('sha256').update(readFileSync(file)).digest('hex'):null;}
function writeReport(folder,report){writeFileSync(path.join(folder,'report.json'),JSON.stringify(report,null,2)+'\n');}

export function runVerification(options,{root=ROOT,spawn=spawnSync,clock=()=>new Date()}={}) {
 if(!options.execute)return {mode:'plan',steps:verificationSteps(options)};
 if(!isSupportedNode(process.versions.node))throw new Error('Requires Node >=22.18; current '+process.versions.node);
 const git=(args)=>tool('git',args,root);
 const branch=git(['branch','--show-current']);
 const head=git(['rev-parse','HEAD']);
 if(branch.status!==0||head.status!==0)throw new Error('Run from a Git worktree with accessible HEAD');
 if(options.resolveLock){
  if(branch.stdout.trim()!=='feat/library-lab')throw new Error('--resolve-lock is only allowed on feat/library-lab');
  const changed=git(['status','--porcelain','--','pnpm-lock.yaml']);
  if(changed.status!==0||changed.stdout.trim())throw new Error('Existing pnpm-lock.yaml edits must be reconciled first');
 }
 const pnpm=tool('pnpm',['--version'],root);
 if(pnpm.error||pnpm.status!==0||!/^10\./u.test(pnpm.stdout.trim()))
  throw new Error('Requires executable pnpm 10.x; no install or test was run');
 const when=clock().toISOString();
 const folder=path.join(root,'packages/library-lab/.local-evidence',when.replace(/[:.]/gu,'-')+'-'+head.stdout.trim().slice(0,12));
 mkdirSync(folder,{recursive:true});
 const report={schemaVersion:1,createdAt:when,head:head.stdout.trim(),branch:branch.stdout.trim(),node:process.versions.node,pnpm:pnpm.stdout.trim(),lockBefore:lockDigest(root),lockAfter:null,steps:[]};
 writeReport(folder,report);
 let failed=false;
 for(const step of verificationSteps(options)){
  const started=clock().toISOString();
  const response=spawn(step.command,step.args,{cwd:root,encoding:'utf8',shell:false,timeout:900_000,maxBuffer:MAX_LOG_BYTES});
  const logName=step.name+'.log';
  writeFileSync(path.join(folder,logName),`$ ${step.command} ${step.args.join(' ')}\n\n${response.stdout??''}\n${response.stderr??''}`);
  const status=response.error?.code==='ENOENT'?'BLOCKED':response.status===0?'PASS':'FAIL';
  report.steps.push({name:step.name,status,exitCode:response.status??null,error:response.error?String(response.error):null,startedAt:started,finishedAt:clock().toISOString(),command:[step.command,...step.args],log:logName});
  writeReport(folder,report);
  console.log(`[${status}] ${step.name} (${logName})`);
  if(status!=='PASS'){failed=true;break;}
 }
 report.lockAfter=lockDigest(root);
 writeReport(folder,report);
 console.log('Local-only evidence: '+folder+' (review logs before sharing)');
 if(failed)process.exitCode=1;
 return report;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const options=parseOptions(process.argv.slice(2));
  if(!options.execute){
   console.log('Plan only: no registry downloads, lockfile writes, tests, or browser startup.');
   console.log('Use --execute for frozen installation and offline/policy/typecheck/build gates.');
   console.log('Optional: --execute --resolve-lock (integration branch, clean lockfile); --sdk OR --sdk-entry=D03; --browser [--setup-browser].');
   for(const step of verificationSteps(options))console.log(`  ${step.command} ${step.args.join(' ')}`);
  }else runVerification(options);
 }catch(error){console.error(String(error));process.exitCode=1;}
}
