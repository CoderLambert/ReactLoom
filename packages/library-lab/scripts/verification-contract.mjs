/** Offline evidence contract shared by catalogue generation and readiness audits. */
import {createHash} from 'node:crypto';

export const VERIFICATION_KINDS = Object.freeze(['sdk','build','browser']);
const ALLOWED = new Set(['PASS','FAIL','NOT_RUN','BLOCKED']);

/** Bind status to the precise displayed source files and declared package versions. */
export function sourceFingerprint(packages, sources) {
 const files = sources.map(({path,sha256})=>({path,sha256})).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 return createHash('sha256').update(JSON.stringify({packages,sources:files})).digest('hex');
}

/** A prior PASS without matching code/versions/command/evidence becomes NOT_RUN. */
export function verifiedState(raw = {}, fingerprint) {
 if(!raw || typeof raw!=='object' || Array.isArray(raw))throw new Error('Invalid verification data');
 const output={};
 for(const [name,value] of Object.entries(raw)){
  if(!value || typeof value!=='object' || Array.isArray(value) || !ALLOWED.has(value.status))
   throw new Error('invalid verification status: '+name);
  if(value.status==='PASS' && (value.sourceFingerprint!==fingerprint || !value.evidence || !value.command))
   output[name]={...value,status:'NOT_RUN',note:'STALE: Previous PASS has no matching current-source fingerprint and command/evidence.'};
  else output[name]=value;
 }
 for(const name of VERIFICATION_KINDS)
  if(!output[name])output[name]={status:'NOT_RUN',note:'No verification evidence has been recorded'};
 return output;
}
