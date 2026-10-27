/** Evidence validation is an integrity check, not a signature or independent attestation. */
import {createHash} from 'node:crypto';
import {lstat,readFile,realpath} from 'node:fs/promises';
import path from 'node:path';

export const VERIFICATION_KINDS = Object.freeze(['sdk','build','browser']);
const ALLOWED = new Set(['PASS','FAIL','NOT_RUN','BLOCKED']);
const HASH = /^[a-f0-9]{64}$/u;
const EVIDENCE = /^docs\/library-lab\/evidence\/runs\/[a-zA-Z0-9_./-]+\.json$/u;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export function sourceFingerprint(packages, sources, inputs) {
 const files=sources.map(({path,sha256})=>({path,sha256})).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 return hash(JSON.stringify({packages,sources:files,...(inputs?{inputs}: {})}));
}

/** Fail closed unless a caller has actually validated the receipt and log bytes. */
export function verifiedState(raw={}, fingerprint, validated=new Map()) {
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Invalid verification data');
 const output={};
 for(const [name,value] of Object.entries(raw)){
  if(!value||typeof value!=='object'||Array.isArray(value)||!ALLOWED.has(value.status))
   throw new Error('invalid verification status: '+name);
  const executed=value.status==='PASS'||value.status==='FAIL';
  const current=value.sourceFingerprint===fingerprint &&
   typeof value.command==='string' && Boolean(value.command.trim()) &&
   typeof value.evidence==='string' && Boolean(value.evidence.trim()) &&
   HASH.test(value.evidenceSha256??'') && validated.get(name)===value.evidenceSha256;
  output[name]=executed&&!current
   ? {...value,status:'NOT_RUN',note:'STALE: Previous '+value.status+' lacks current inputs and a verified receipt/log.'}
   : value;
 }
 for(const kind of VERIFICATION_KINDS)
  if(!output[kind])output[kind]={status:'NOT_RUN',note:'No verification evidence has been recorded'};
 return output;
}

export function verificationCommand(kind,entryId){
 if(!/^[A-F]\d{2}$/u.test(entryId)||!VERIFICATION_KINDS.includes(kind))throw new Error('Invalid verification target');
 if(kind==='sdk')return ['node','scripts/sdk-runner.mjs',`--entry=${entryId}`];
 if(kind==='build')return ['pnpm','build'];
 return ['pnpm','exec','playwright','test','--grep',`@${entryId}\\b`];
}

async function boundedFile(root,relative,maxBytes){
 if(typeof relative!=='string'||relative.startsWith('/')||/[\\:\u0000-\u001f]/u.test(relative)||
   relative.split('/').some(p=>!p||p==='.'||p==='..'))throw new Error('Invalid evidence path');
 const base=await realpath(root), target=path.join(base,relative);
 const resolved=await realpath(target),stat=await lstat(target);
 if(resolved!==target||!resolved.startsWith(base+path.sep)||!stat.isFile()||stat.size>maxBytes)
  throw new Error('Evidence is not a bounded regular file');
 const bytes=await readFile(target);
 if(bytes.length>maxBytes)throw new Error('Evidence grew beyond its limit');
 return bytes;
}

export async function verifiedStateFromFiles(raw,fingerprint,{repoRoot,entryId}){
 const validated=new Map();
 // Validate the basic shape first, without accepting any unverified result.
 const state=verifiedState(raw,fingerprint);
 for(const kind of VERIFICATION_KINDS){
  const record=raw?.[kind];
  if(!record||!['PASS','FAIL'].includes(record.status)||record.sourceFingerprint!==fingerprint)continue;
  try{
   if(!EVIDENCE.test(record.evidence??'')||!HASH.test(record.evidenceSha256??''))throw new Error('Missing receipt digest');
   const bytes=await boundedFile(repoRoot,record.evidence,256_000);
   if(hash(bytes)!==record.evidenceSha256)throw new Error('Receipt digest mismatch');
   const receipt=JSON.parse(bytes.toString('utf8'));
   const expected=verificationCommand(kind,entryId).join(' ');
   const start=Date.parse(receipt.startedAt),end=Date.parse(receipt.finishedAt);
   if(receipt.schemaVersion!==1||receipt.kind!==kind||receipt.entryId!==entryId||
     receipt.sourceFingerprint!==fingerprint||receipt.command!==expected||record.command!==expected||
     receipt.status!==record.status||!Number.isSafeInteger(receipt.exitCode)||receipt.exitCode<0||
     ((receipt.exitCode===0)!==(record.status==='PASS'))||!HASH.test(fingerprint)||
     !/^[a-f0-9]{40}$/u.test(receipt.head??'')||!/^\d+\.\d+\.\d+/u.test(receipt.node??'')||
     !Number.isFinite(start)||!Number.isFinite(end)||end<start)throw new Error('Receipt does not describe this execution');
   if(typeof receipt.log?.path!=='string'||!receipt.log.path.startsWith('docs/library-lab/evidence/runs/')||
     !receipt.log.path.endsWith('.log')||!HASH.test(receipt.log.sha256??''))throw new Error('Invalid log reference');
   const log=await boundedFile(repoRoot,receipt.log.path,24*1024*1024);
   if(log.length===0||log.length!==receipt.log.bytes||hash(log)!==receipt.log.sha256)throw new Error('Log digest mismatch');
   validated.set(kind,record.evidenceSha256);
  }catch(error){state[kind]={...state[kind],note:state[kind].note+' '+String(error)};}
 }
 const accepted=verifiedState(raw,fingerprint,validated);
 for(const kind of VERIFICATION_KINDS)if(!validated.has(kind)&&state[kind]?.note)accepted[kind]=state[kind];
 return accepted;
}
