import {generateWorkbook,inspectWorkbook} from './core.mjs';
const {bytes,totals}=await generateWorkbook('basic');
const info=await inspectWorkbook(bytes);
console.log(JSON.stringify({scenario:'basic',bytes:bytes.byteLength,totals,info},null,2));
