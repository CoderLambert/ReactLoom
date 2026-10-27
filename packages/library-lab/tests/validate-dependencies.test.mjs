import test from 'node:test';
import assert from 'node:assert/strict';
import {checkDependencyContract} from '../scripts/validate-dependencies.mjs';
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
