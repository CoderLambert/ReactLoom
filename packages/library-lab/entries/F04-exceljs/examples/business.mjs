import {generateWorkbook,inspectWorkbook} from './core.mjs';
const {bytes,totals}=await generateWorkbook('business');
const info=await inspectWorkbook(bytes);
console.log(JSON.stringify({scenario:'business',bytes:bytes.byteLength,totals,info},null,2));
