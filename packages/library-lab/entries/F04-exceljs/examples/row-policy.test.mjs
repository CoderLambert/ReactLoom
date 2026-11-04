import test from 'node:test';
import assert from 'node:assert/strict';
import {checkRows,safeSpreadsheetText,MAX_EXCEL_INTEGER} from './row-policy.mjs';
const row={id:'r01',source:'React Updates',reads:52,stars:5};
test('validates bounded rows and calculates safe totals',()=>{
 assert.deepEqual(checkRows([row,{...row,id:'r02',reads:8,stars:1}]),{reads:60,stars:6});
});
test('rejects duplicate identities including whitespace/case',()=>{
 assert.throws(()=>checkRows([row,{...row,id:' R01 '}]),/duplicate/);
});
test('rejects missing fields, invalid text and unsafe aggregates',()=>{
 for(const bad of [null,{...row,source:undefined},{...row,source:''},{...row,source:7},{...row,source:'hello\u0000world'},{...row,id:''},{...row,id:'bad\u0000id'},{...row,reads:-1}]){
  assert.throws(()=>checkRows([bad]));
 }
 assert.throws(()=>checkRows([{...row,reads:Number.MAX_SAFE_INTEGER},{...row,id:'r02',reads:1}]),/aggregate/);
 assert.throws(()=>checkRows(Array.from({length:501},(_,i)=>({...row,id:String(i)}))),/500/);
});
test('protects formula-leading text even with whitespace before it',()=>{
 assert.equal(safeSpreadsheetText(' =HYPERLINK("https://example.org") '),"'=HYPERLINK(\"https://example.org\")");
 assert.equal(safeSpreadsheetText(' @SUM(A1:A9)'),"'@SUM(A1:A9)");
 assert.throws(()=>safeSpreadsheetText(' '),/invalid/);
});
test('rejects values or SUM caches exceeding Excel 15-digit precision',()=>{
 assert.deepEqual(checkRows([{...row,reads:MAX_EXCEL_INTEGER,stars:0}]),{reads:MAX_EXCEL_INTEGER,stars:0});
 assert.throws(()=>checkRows([{...row,reads:MAX_EXCEL_INTEGER+1}]),/unsafe aggregate reads/);
 assert.throws(()=>checkRows([{...row,reads:MAX_EXCEL_INTEGER},{...row,id:'r02',reads:1}]),/unsafe aggregate reads/);
});
