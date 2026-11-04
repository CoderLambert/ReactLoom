import {exportWorkbook,importWorkbook,fixture} from './core.mjs';
const bytes=exportWorkbook(fixture);
const rows=importWorkbook(bytes);
console.log(JSON.stringify({bytes:bytes.byteLength,rows},null,2));
if(rows.length!==3)throw new Error('roundtrip failed');
