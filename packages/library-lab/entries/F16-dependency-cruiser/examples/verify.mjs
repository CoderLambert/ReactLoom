// Two distinct real CLI reporters: JSON structure and strict err exit contract.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {checkCruiseReport,checkCruiseExit} from './result-policy.mjs';

const cwd=fileURLToPath(new URL('./workspace/',import.meta.url));
const binary=process.platform==='win32'?'pnpm.cmd':'pnpm';
for(const level of ['basic','business','advanced']){
  const execute=reporter=>spawnSync(binary,[
    'exec','depcruise','--config','config.cjs','--output-type',reporter,level+'/src'
  ],{cwd,encoding:'utf8',maxBuffer:8_000_000,timeout:60_000,windowsHide:true});
  // The JSON output mode need not implement err reporter's non-zero contract.
  const json=execute('json');
  if(json.error||json.signal) throw Error('JSON CLI unavailable/terminated: '+String(json.error??json.signal));
  let result;
  try{result=checkCruiseReport(level,json.stdout)}
  catch(error){process.stderr.write(level+' stderr: '+(json.stderr||'')+'\n');throw error}
  const strict=execute('err');
  checkCruiseExit(level,strict);
  process.stdout.write(level+': real depcruise modules='+result.modules+
    ', errorRules='+result.errors+', strictExit='+strict.status+'\n');
}
