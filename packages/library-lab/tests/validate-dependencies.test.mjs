import test from 'node:test';
import assert from 'node:assert/strict';
import {checkDependencyContract} from '../scripts/validate-dependencies.mjs';
import {readFile} from 'node:fs/promises';
const fixture={entryId:'C01',packages:[{name:'react-hook-form',version:'7.89.0'}],demos:[{demoId:'basic'}]};
test('checks only runnable or reproducible entries against the actual package manifest',()=>{
 const result=checkDependencyContract([fixture,{...fixture,entryId:'B01',demos:[],packages:[{name:'not-added',version:null}]}],{dependencies:{'react-hook-form':'7.89.0'}});
 assert.deepEqual(result,{checked:1,referenced:1,errors:[]});
});
test('detects absent, duplicate, invalid and version-drifted package references',()=>{
 const results=checkDependencyContract([{...fixture,packages:[{name:'react-hook-form',version:'7.0.0'},{name:'unknown',version:'1.0.0'},{name:'../bad',version:null},{name:'react-hook-form',version:'7.89.0'}]}],{dependencies:{'react-hook-form':'7.89.0'}});
 assert.equal(results.errors.length,4);
 assert.match(results.errors.join('\n'),/metadata 7.0.0/);
 assert.match(results.errors.join('\n'),/missing unknown/);
});

test('SheetJS CE 0.20.3 must resolve to official tarball, not stale registry xlsx',()=>{
 const sheetjs={entryId:'F05',packages:[{name:'xlsx',version:'0.20.3'}],demos:[{demoId:'basic'}]};
 const official={devDependencies:{xlsx:'https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz'}};
 assert.deepEqual(checkDependencyContract([sheetjs],official).errors,[]);
 assert.match(checkDependencyContract([sheetjs],{dependencies:{xlsx:'0.20.3'}}).errors.join(','),/metadata 0.20.3/u);
});

// Offline integration contract: these four packages are imported by real React
// examples and cannot be replaced by inert guide-only metadata or SDK mocks.
test('current E03/F01/F17 SDK manifests match the package used for runtime', async () => {
 const load = async relative => JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'));
 const [pkg, lexical, uppy, axe] = await Promise.all([
  load('../package.json'),
  load('../entries/E03-lexical/library.json'),
  load('../entries/F01-uppy/library.json'),
  load('../entries/F17-axe-core/library.json'),
 ]);
 assert.deepEqual(checkDependencyContract([lexical, uppy, axe], pkg).errors, []);
 for (const [name, version] of Object.entries({
  lexical: '0.52.0', '@lexical/react': '0.52.0', '@uppy/core': '6.1.0', 'axe-core': '4.14.0',
 })) assert.equal(pkg.dependencies[name], version, `${name} must be installable at the reviewed version`);
});
