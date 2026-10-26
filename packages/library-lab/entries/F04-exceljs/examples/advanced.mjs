import {generateWorkbook,inspectWorkbook,FIXTURE} from './core.mjs';
import assert from 'node:assert/strict';
const rows=[...FIXTURE,{id:'r04',source:'=HYPERLINK("https://example.invalid","click")',reads:0,stars:0}];
const {bytes}=await generateWorkbook('advanced',rows);
const actual=await inspectWorkbook(bytes);
assert.equal(typeof actual.firstSource,'string');
const invalid=[{id:'bad',source:'Invalid',reads:NaN,stars:1}];
await assert.rejects(generateWorkbook('advanced',invalid),/invalid reads/);
console.log(JSON.stringify({scenario:'advanced',bytes:bytes.byteLength,totalCell:actual.summary,formulaInputWasEscaped:true},null,2));
