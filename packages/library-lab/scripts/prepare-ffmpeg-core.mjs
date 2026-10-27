/** Stage the version-locked GPL FFmpeg core only after an explicit distribution review. */
import {mkdtemp, mkdir, readFile, writeFile, lstat, rm, rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const VERSION = '0.12.10';
const MARKER = '.library-lab-generated.json';
const ASSETS = ['ffmpeg-core.js', 'ffmpeg-core.wasm'];

async function removeGenerated(directory) {
  let stat;
  try {stat = await lstat(directory);} catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Refusing to replace a non-directory FFmpeg asset path');
  let marker;
  try {marker = JSON.parse(await readFile(path.join(directory, MARKER), 'utf8'));}
  catch {throw new Error('Refusing to delete FFmpeg assets not managed by Library Lab');}
  if (marker.generator !== 'reactloom-library-lab' || marker.version !== VERSION)
    throw new Error('Refusing to delete FFmpeg assets with unknown provenance');
  await rm(directory, {recursive:true,force:true});
}

/** Never stage @ffmpeg/core just because dependencies have been installed. */
export async function prepareFfmpegCore(root = ROOT, {approved = process.env.LIBRARY_LAB_FFMPEG_CORE_LICENSE_REVIEWED === 'true'} = {}) {
  const publicRoot = path.join(root, 'public');
  const destination = path.join(publicRoot, 'ffmpeg-core');
  if (!approved) {
    await removeGenerated(destination);
    return {status:'BLOCKED', reason:'GPL core redistribution requires explicit review'};
  }
  const sourceRoot = path.join(root, 'node_modules', '@ffmpeg', 'core');
  const metadata = JSON.parse(await readFile(path.join(sourceRoot, 'package.json'),'utf8'));
  if (metadata.name !== '@ffmpeg/core' || metadata.version !== VERSION || !String(metadata.license).startsWith('GPL-2.0'))
    throw new Error('Unreviewed FFmpeg core package version or license; refusing to stage');
  const contents = [];
  for (const filename of ASSETS) {
    const full = path.join(sourceRoot,'dist','esm',filename);
    const stat = await lstat(full);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 100_000_000 || stat.size === 0)
      throw new Error('Missing or unsafe FFmpeg core asset: '+filename);
    const data = await readFile(full);
    contents.push({filename, data, sha256:createHash('sha256').update(data).digest('hex')});
  }
  await mkdir(publicRoot,{recursive:true});
  const temp = await mkdtemp(path.join(publicRoot,'.ffmpeg-core-staging-'));
  try {
    for (const asset of contents) await writeFile(path.join(temp,asset.filename),asset.data);
    const stageManifest = {generator:'reactloom-library-lab',version:VERSION,license:metadata.license,
      assets:contents.map(({filename,data,sha256})=>({filename,bytes:data.byteLength,sha256}))};
    await writeFile(path.join(temp,MARKER),JSON.stringify(stageManifest,null,2)+'\n');
    await removeGenerated(destination);
    await rename(temp,destination);
    return {status:'STAGED',version:VERSION,assets:stageManifest.assets.length};
  } finally {await rm(temp,{recursive:true,force:true});}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await prepareFfmpegCore();
    console.log(JSON.stringify(result));
  } catch (error) {console.error(String(error));process.exitCode=1;}
}
