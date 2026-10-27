/** Run a fixed verification command and produce a receipt; never edits entry metadata. */
import {spawnSync,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verificationCommand} from './verification-contract.mjs';
import {readinessReport} from './readiness.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const repo=path.resolve(root,'../..');
const hash=value=>createHash('sha256').update(value).digest('hex');
export function parseRecordArgs(args){
 const result={execute:false,entryId:null,kind:null};
 for(const arg of args){
  if(arg==='--execute'&&!result.execute)result.execute=true;
  else if(/^--entry=[A-F]\d{2}$/u.test(arg)&&!result.entryId)result.entryId=arg.slice(8);
  else if(/^--kind=(sdk|build|browser)$/u.test(arg)&&!result.kind)result.kind=arg.slice(7);
  else throw new Error('Usage: --entry=D03 --kind=sdk|build|browser [--execute]');
 }
 verificationCommand(result.kind,result.entryId);return result;
}
export async function recordVerification(options){
 const command=verificationCommand(options.kind,options.entryId);
 if(!options.execute)return {mode:'plan',command};
 const [major,minor]=process.versions.node.split('.').map(Number);
 if(major<22||(major===22&&minor<18))throw new Error('Requires Node >=22.18; no verification ran');
 const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const head=git(['rev-parse','HEAD']);
 if(git(['status','--porcelain','--','packages/library-lab','pnpm-lock.yaml','pnpm-workspace.yaml','package.json','.npmrc']))
  throw new Error('Commit or reconcile runtime inputs before recording evidence');
 const lock=await readFile(path.join(repo,'pnpm-lock.yaml'),'utf8');
 if(!/^  packages\/library-lab:\s*$/mu.test(lock))throw new Error('A real Library Lab lock importer is required');
 const inventory=()=>readinessReport(path.join(root,'entries'),{group:options.entryId[0]});
 const before=(await inventory()).entries.find(entry=>entry.id===options.entryId);
 if(!before?.fingerprint)throw new Error('Entry is not source-complete');
 const startedAt=new Date().toISOString();
 const response=spawnSync(command[0]==='node'?process.execPath:command[0],command.slice(1),
  {cwd:root,encoding:'utf8',shell:false,timeout:900_000,maxBuffer:24*1024*1024});
 const finishedAt=new Date().toISOString();
 if(response.error||!Number.isSafeInteger(response.status))throw response.error??new Error('Verification process did not return a usable exit code');
 const after=(await inventory()).entries.find(entry=>entry.id===options.entryId);
 if(before.fingerprint!==after?.fingerprint)throw new Error('Execution inputs changed during verification; receipt refused');
 const prefix=`docs/library-lab/evidence/runs/${startedAt.replace(/[:.]/gu,'-')}-${options.entryId}-${options.kind}`;
 const logPath=prefix+'.log',evidence=prefix+'.json';
 const log=Buffer.from(`$ ${command.join(' ')}\n${response.stdout??''}\n${response.stderr??''}`);
 if(log.length>24*1024*1024)throw new Error('Combined verification log exceeds the evidence limit');
 await mkdir(path.dirname(path.join(repo,evidence)),{recursive:true});
 await writeFile(path.join(repo,logPath),log);
 const receipt={schemaVersion:1,kind:options.kind,entryId:options.entryId,sourceFingerprint:before.fingerprint,
  command:command.join(' '),status:response.status===0?'PASS':'FAIL',exitCode:response.status,head,node:process.versions.node,
  lockSha256:hash(lock),startedAt,finishedAt,log:{path:logPath,sha256:hash(log),bytes:log.length}};
 const bytes=JSON.stringify(receipt,null,2)+'\n';await writeFile(path.join(repo,evidence),bytes);
 if(response.status!==0)process.exitCode=response.status;
 return {entryId:options.entryId,[options.kind]:{status:receipt.status,sourceFingerprint:before.fingerprint,
  command:receipt.command,evidence,evidenceSha256:hash(bytes)}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await recordVerification(parseRecordArgs(process.argv.slice(2))),null,2));}
 catch(error){console.error(String(error));process.exitCode=1;}
}
