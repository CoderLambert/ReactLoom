import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const url=new URL('./openapi/news.json',import.meta.url);
const doc=JSON.parse(await readFile(url,'utf8'));
assert.equal(doc.openapi,'3.0.3');
const seen=new Set();
for (const path of Object.values(doc.paths))for(const value of Object.values(path)){
  if(!value||typeof value!=='object'||!value.operationId)continue;
  assert.ok(!seen.has(value.operationId),'unique operationId');seen.add(value.operationId);
  for(const ref of ['Source','CreateSource','Error'])assert.ok(doc.components.schemas[ref]);
}
assert.equal(seen.size,3);
assert.equal(doc.servers[0].url,'http://127.0.0.1:4319');
console.log('Offline OpenAPI shape checks passed; actual Orval CLI NOT exercised');
