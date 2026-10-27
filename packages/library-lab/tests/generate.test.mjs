import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {generate} from '../scripts/generate.mjs';
const fixture={schemaVersion:1,entryId:'D03',group:'D',slug:'p-limit',name:'p-limit',summary:'并发控制',contentState:'reviewed',tags:[],packages:[],references:[],related:[],demos:[{demoId:'basic',title:'并发',level:'basic',executionKind:'react',entryPoint:'examples/demo.tsx',sourceFiles:['examples/demo.tsx']}]};
async function setup(t){const root=await mkdtemp(path.join(tmpdir(),'library-gen-'));t.after(()=>rm(root,{recursive:true,force:true}));const dir=path.join(root,'entries/D03-p-limit');await mkdir(path.join(dir,'examples'),{recursive:true});await writeFile(path.join(dir,'library.json'),JSON.stringify(fixture));await writeFile(path.join(dir,'guide.md'),'# 安全指南');await writeFile(path.join(dir,'agent.md'),'# 工程指南');await writeFile(path.join(dir,'examples/demo.tsx'),'export default function Demo(){return null;}');return{root,dir};}
test('generates exact source hashes, lazy loaders and raw markdown',async t=>{const {root}=await setup(t);const result=await generate(root,{expectedCount:1});assert.equal(result.entries,1);const catalog=JSON.parse(await readFile(path.join(root,'public/catalog.json'),'utf8'));assert.equal(catalog[0].guideAvailable,true);const sources=JSON.parse(await readFile(path.join(root,'public/raw/D03/source-index.json'),'utf8'));const raw=await readFile(path.join(root,'public/raw/D03/sources',sources[0].path+'.txt'),'utf8');assert.equal(sources[0].sha256,createHash('sha256').update(raw).digest('hex'));const loaders=await readFile(path.join(root,'src/generated/loaders.ts'),'utf8');assert.match(loaders,/\(\) => import\(/);assert.doesNotMatch(loaders,/import Demo/);assert.equal(await readFile(path.join(root,'public/raw/D03/guide.md'),'utf8'),'# 安全指南');});
test('rejects missing SDK demo source rather than silently downgrade',async t=>{const{root,dir}=await setup(t);await rm(path.join(dir,'examples/demo.tsx'));await assert.rejects(generate(root,{expectedCount:1}),/ENOENT/);});
test('rejects unknown relationship target',async t=>{const{root,dir}=await setup(t);await writeFile(path.join(dir,'library.json'),JSON.stringify({...fixture,related:[{entryId:'A01',relation:'complements',reason:'组合'}]}));await assert.rejects(generate(root,{expectedCount:1}),/unknown related/);});
test('catalogue generation is repeatable',async t=>{const{root}=await setup(t);await generate(root,{expectedCount:1});const a=await readFile(path.join(root,'public/catalog.json'),'utf8');await generate(root,{expectedCount:1});assert.equal(await readFile(path.join(root,'public/catalog.json'),'utf8'),a);});


test('source verification cannot be promoted by matching metadata without an actual receipt',async t=>{
  const {root,dir}=await setup(t);
  await writeFile(path.join(dir,'verification.json'),JSON.stringify({sdk:{status:'PASS',command:'node test',evidence:'artifact-1',sourceFingerprint:'old-hash'}}));
  await generate(root,{expectedCount:1});
  const entry=JSON.parse(await readFile(path.join(root,'public/catalog.json'),'utf8'))[0];
  assert.equal(entry.verification.sdk.status,'NOT_RUN');
  assert.match(entry.verification.sdk.note,/STALE/);
  assert.equal(entry.sourceFingerprint.length,64);
  await writeFile(path.join(dir,'verification.json'),JSON.stringify({sdk:{status:'PASS',command:'node test',evidence:'artifact-1',sourceFingerprint:entry.sourceFingerprint}}));
  await generate(root,{expectedCount:1});
  const accepted=JSON.parse(await readFile(path.join(root,'public/catalog.json'),'utf8'))[0];
  assert.equal(accepted.verification.sdk.status,'NOT_RUN');
});

test('only small local raster assets are copied into the generated raw folder',async t=>{
  const {root,dir}=await setup(t);
  await mkdir(path.join(dir,'assets'),{recursive:true});
  const png=Buffer.from([137,80,78,71,13,10,26,10]);
  await writeFile(path.join(dir,'assets/chart.png'),png);
  await writeFile(path.join(dir,'assets/script.svg'),'<svg onload="alert(1)"/>');
  await generate(root,{expectedCount:1});
  assert.deepEqual(await readFile(path.join(root,'public/raw/D03/assets/chart.png')),png);
  await assert.rejects(readFile(path.join(root,'public/raw/D03/assets/script.svg')), /ENOENT/);
});

test('source listing stays metadata-only and each source is independently retrievable',async t=>{
 const {root,dir}=await setup(t);
 await writeFile(path.join(dir,'examples/demo.tsx'),'export default function Demo(){return <p>Real source</p>;}');
 await generate(root,{expectedCount:1});
 const index=JSON.parse(await readFile(path.join(root,'public/raw/D03/source-index.json'),'utf8'));
 assert.equal(index.length,1);
 assert.equal(index[0].path,'examples/demo.tsx');
 assert.equal(index[0].content,undefined,'index must not duplicate large source code');
 const raw=await readFile(path.join(root,'public/raw/D03/sources/examples/demo.tsx.txt'),'utf8');
 assert.match(raw,/Real source/);
 assert.equal(index[0].sha256,createHash('sha256').update(raw).digest('hex'));
 await assert.rejects(readFile(path.join(root,'public/raw/D03/sources.json')), /ENOENT/);
});

test('worker entries produce deferred Vite module-worker factories and no React import',async t=>{
 const {root,dir}=await setup(t);
 await writeFile(path.join(dir,'examples/calculate.worker.ts'),"self.onmessage = () => self.postMessage({type: 'result'});");
 await writeFile(path.join(dir,'library.json'),JSON.stringify({...fixture,demos:[{demoId:'advanced',title:'Worker',level:'advanced',executionKind:'worker',entryPoint:'examples/calculate.worker.ts',sourceFiles:['examples/calculate.worker.ts'],capabilities:['web-worker']}]}));
 const generated=await generate(root,{expectedCount:1});
 assert.equal(generated.loaders,0);
 const worker=await readFile(path.join(root,'src/generated/worker-loaders.ts'),'utf8');
 assert.match(worker,/new Worker\(new URL\(/u);
 assert.match(worker,/calculate\.worker\.ts/u);
 const react=await readFile(path.join(root,'src/generated/loaders.ts'),'utf8');
 assert.doesNotMatch(react,/calculate\.worker\.ts/u);
});

test('landing catalogue is lightweight; full detail is fetched only by ID and bound to the same fingerprint',async t=>{
 const {root}=await setup(t);
 await generate(root,{expectedCount:1});
 const overview=JSON.parse(await readFile(path.join(root,'public/catalog-index.json'),'utf8'));
 const detail=JSON.parse(await readFile(path.join(root,'public/raw/D03/detail.json'),'utf8'));
 assert.equal(overview.length,1);
 assert.equal(overview[0].entryId,'D03');
 assert.equal(overview[0].hasDemo,true);
 for(const field of ['demos','packages','verification','references']) assert.equal(Object.hasOwn(overview[0],field),false);
 assert.equal(detail.sourceFingerprint,overview[0].sourceFingerprint);
 assert.equal(detail.demos[0].entryPoint,'examples/demo.tsx');
 assert.equal(detail.guideAvailable,true);
});

test('source index bytes are pinned by the generated detail digest',async t=>{
 const {root}=await setup(t);
 await generate(root,{expectedCount:1});
 const detail=JSON.parse(await readFile(path.join(root,'public/raw/D03/detail.json'),'utf8'));
 const index=await readFile(path.join(root,'public/raw/D03/source-index.json'),'utf8');
 assert.equal(detail.sourceIndexSha256,createHash('sha256').update(index).digest('hex'));
 assert.match(detail.sourceIndexSha256,/^[a-f0-9]{64}$/u);
});
