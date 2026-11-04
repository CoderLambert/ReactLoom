import test from 'node:test';
import assert from 'node:assert/strict';
import {AllCommunityModule,themeQuartz,ModuleRegistry} from 'ag-grid-community';
test('actual AG Grid community modules and themes import',()=>{
 assert.ok(AllCommunityModule);
 assert.equal(typeof themeQuartz.withParams,'function');
 assert.equal(typeof ModuleRegistry.registerModules,'function');
});
test('theme can be configured using SDK theme API',()=>{
 const theme=themeQuartz.withParams({accentColor:'#296b51'});
 assert.ok(theme);
});
