import assert from 'node:assert/strict';
import {generateWorkbook,inspectWorkbook,FIXTURE,safeSpreadsheetText} from './core.mjs';
for (const level of ['basic','business','advanced']) {
  const result=await generateWorkbook(level);
  const restored=await inspectWorkbook(result.bytes);
  assert.equal(restored.firstSource,'React Updates');
  assert.equal(restored.frozen,true);
  if (level!=='basic') {
    assert.equal(restored.summary?.formula,'SUM(C2:C4)');
    assert.equal(restored.summary?.result,115);
  }
}
assert.equal(safeSpreadsheetText('=2+3'),"'=2+3");
assert.equal(safeSpreadsheetText('@SUM(A1:A9)'),"'@SUM(A1:A9)");
await assert.rejects(generateWorkbook('advanced',[{id:'x',source:'x',reads:Infinity,stars:1}]),/invalid reads/);
console.log('ExcelJS actual SDK roundtrip assertions completed');
