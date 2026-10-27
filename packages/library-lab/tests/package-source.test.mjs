import test from 'node:test';
import assert from 'node:assert/strict';
import {SHEETJS_CE_0203,allowedPackageResolution,packageInstallCommand} from '../src/lib/package-source.mjs';
const spreadsheet = {name:'xlsx',version:'0.20.3'};
test('SheetJS CE installation points to official exact-version release',()=>{
  assert.equal(packageInstallCommand([spreadsheet]),'pnpm add xlsx@'+SHEETJS_CE_0203);
  assert.equal(allowedPackageResolution(spreadsheet,SHEETJS_CE_0203),true);
});
test('rejects stale npm registry, altered CDN and unreviewed SheetJS versions',()=>{
  assert.equal(allowedPackageResolution(spreadsheet,'0.20.3'),false);
  assert.equal(allowedPackageResolution(spreadsheet,'https://example.com/xlsx.tgz'),false);
  assert.equal(allowedPackageResolution({...spreadsheet,version:'0.20.4'},SHEETJS_CE_0203),false);
  assert.throws(()=>packageInstallCommand([{name:'xlsx',version:'0.20.4'}]));
});
test('ordinary packages remain exactly pinned to the manifest',()=>{
  const pkg={name:'@reduxjs/toolkit',version:'2.13.0'};
  assert.equal(allowedPackageResolution(pkg,'2.13.0'),true);
  assert.equal(allowedPackageResolution(pkg,'^2.13.0'),false);
  assert.equal(packageInstallCommand([pkg]),'pnpm add @reduxjs/toolkit@2.13.0');
});
test('rejects unsafe package identifiers before producing copyable commands',()=>{
  for(const name of ['x;rm -rf /','bad name','pkg\nsh','../../test']) {
    assert.throws(()=>packageInstallCommand([{name,version:'1.2.3'}]));
    assert.equal(allowedPackageResolution({name,version:'1.2.3'},'1.2.3'),false);
  }
});
test('does not fabricate a generic npm install when no SDK is declared',()=>{
  assert.equal(packageInstallCommand([]),'无需额外安装 npm 包');
});
