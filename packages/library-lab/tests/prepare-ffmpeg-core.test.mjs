import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {prepareFfmpegCore} from '../scripts/prepare-ffmpeg-core.mjs';
async function fixture(t){
 const root=await mkdtemp(path.join(tmpdir(),'ll-ffmpeg-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const dir=path.join(root,'node_modules/@ffmpeg/core/dist/esm');await mkdir(dir,{recursive:true});
 await writeFile(path.join(root,'node_modules/@ffmpeg/core/package.json'),JSON.stringify({name:'@ffmpeg/core',version:'0.12.10',license:'GPL-2.0-or-later'}));
 await writeFile(path.join(dir,'ffmpeg-core.js'),'fixture ESM');
 await writeFile(path.join(dir,'ffmpeg-core.wasm'),Buffer.from([0,97,115,109]));
 return root;
}
test('no redistribution without explicit review',async t=>{
 const root=await fixture(t);const state=await prepareFfmpegCore(root,{approved:false});
 assert.equal(state.status,'BLOCKED');
 await assert.rejects(readFile(path.join(root,'public/ffmpeg-core/ffmpeg-core.js')));
});
test('approved exact version stages both assets and reproducible hashes',async t=>{
 const root=await fixture(t);const state=await prepareFfmpegCore(root,{approved:true});
 assert.deepEqual(state,{status:'STAGED',version:'0.12.10',assets:2});
 const stageManifest=JSON.parse(await readFile(path.join(root,'public/ffmpeg-core/.library-lab-generated.json'),'utf8'));
 assert.equal(stageManifest.license,'GPL-2.0-or-later');
 assert.equal(stageManifest.assets.length,2);
 assert.match(stageManifest.assets[0].sha256,/^[0-9a-f]{64}$/u);
 await prepareFfmpegCore(root,{approved:false});
 await assert.rejects(readFile(path.join(root,'public/ffmpeg-core/ffmpeg-core.js')));
});
test('refuses unsafe or unexpected preexisting files',async t=>{
 const root=await fixture(t);const target=path.join(root,'public/ffmpeg-core');await mkdir(target,{recursive:true});
 await writeFile(path.join(target,'manual.txt'),'user asset');
 await assert.rejects(prepareFfmpegCore(root,{approved:false}),/Refusing to delete/);
 assert.equal(await readFile(path.join(target,'manual.txt'),'utf8'),'user asset');
});
test('refuses a different version or license before publishing',async t=>{
 const root=await fixture(t);const pkg=path.join(root,'node_modules/@ffmpeg/core/package.json');
 await writeFile(pkg,JSON.stringify({name:'@ffmpeg/core',version:'0.12.11',license:'MIT'}));
 await assert.rejects(prepareFfmpegCore(root,{approved:true}),/Unreviewed/);
});
