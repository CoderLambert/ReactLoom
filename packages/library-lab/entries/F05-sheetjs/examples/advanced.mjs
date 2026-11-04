import {exportWorkbook,importWorkbook,normalize} from './core.mjs';
import assert from 'node:assert/strict';
const rows=[{channel:'=HYPERLINK("https://example.com")',views:0,kind:'测试'}];
const restored=importWorkbook(exportWorkbook(rows));
assert.ok(restored[0].channel.startsWith("'="));
for(const invalid of [[{channel:'bad',views:-1,kind:'测试'}],[{channel:'bad',views:1.3,kind:'测试'}],[...rows,...rows]]){
 assert.throws(()=>normalize(invalid));
}
console.log(JSON.stringify({text:restored[0].channel,blocked:['negative','fractional','duplicate']},null,2));
