import assert from 'node:assert/strict';
import {exportWorkbook,importWorkbook,fixture} from './core.mjs';
assert.deepEqual(importWorkbook(exportWorkbook(fixture)),fixture);
console.log('F05 SheetJS real SDK roundtrip: PASS (only when this CLI was actually executed)');

import * as XLSX from 'xlsx';
function workbookBytes(rows){
 const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(rows),'Subscriptions');
 return XLSX.write(book,{bookType:'xlsx',type:'buffer'});
}
for (const malformed of [
 [['channel','views'],['Unmapped',1]],
 [['channel','views','kind','extra'],['Unmapped',1,'RSS','ignored']],
 [['channel','views','kind'],['A',1,'RSS'],['a',2,'RSS']],
 [['channel','views','kind'],['A',-1,'RSS']],
]) assert.throws(()=>importWorkbook(workbookBytes(malformed)));
const formula = XLSX.utils.book_new();
const formulaSheet=XLSX.utils.aoa_to_sheet([['channel','views','kind'],['A',1,'RSS']]);
formulaSheet.A2={t:'n',f:'2+2',v:4};
XLSX.utils.book_append_sheet(formula,formulaSheet,'Subscriptions');
assert.throws(()=>importWorkbook(XLSX.write(formula,{bookType:'xlsx',type:'buffer'})));
