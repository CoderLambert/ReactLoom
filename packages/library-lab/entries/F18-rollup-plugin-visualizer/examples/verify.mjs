import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {stat,readFile,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {checkVisualizerReport} from './report-policy.mjs';

const dir=fileURLToPath(new URL('.',import.meta.url));
const lab=path.resolve(dir,'../../../');
const config=path.join(dir,'vite.config.ts');
const binary=process.platform==='win32'?'pnpm.cmd':'pnpm';
const suffix={basic:'.html',business:'.md',advanced:'.json'};
for(const level of Object.keys(suffix)){
  const report=path.join(dir,'reports',level+suffix[level]);
  const dist=path.join(dir,'reports','dist-'+level);
  // These are fixed own-fixture paths, never the application build directory.
  await rm(report,{force:true});
  await rm(dist,{force:true,recursive:true});
  const run=spawnSync(binary,['exec','vite','build','--config',config,'--mode',level],
    {cwd:lab,encoding:'utf8',maxBuffer:8_000_000,timeout:120_000,windowsHide:true});
  if(run.error||run.signal||run.status!==0)
    throw Error(level+' actual Vite build failed: '+String(run.error??run.signal??(run.stderr||run.stdout)).slice(0,3000));
  const info=await stat(report);
  const body=await readFile(report,'utf8');
  const chunks=level==='advanced'?await readdir(path.join(dist,'assets')):[];
  checkVisualizerReport(level,body,chunks);
  process.stdout.write(level+': fresh real Vite report '+info.size+
    ' bytes'+(level==='advanced'?', JS chunks='+chunks.filter(p=>p.endsWith('.js')).length:'')+'\n');
}
