import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBlockSnapshot,MAX_SNAPSHOT} from '../examples/snapshot-policy.mjs';

test('normalizes text blocks and removes persisted instance identifiers',()=>{
  const result = parseBlockSnapshot(JSON.stringify([{id:'old',type:'heading',props:{level:2},content:[{type:'text',text:'标题',styles:{bold:true}}],children:[{id:'nested',type:'paragraph',content:'文字'}]}]));
  assert.equal(result[0].id,undefined);
  assert.equal(result[0].children[0].id,undefined);
  assert.equal(result[0].content[0].text,'标题');
});
test('rejects oversized, malformed and executable URL content',()=>{
  for(const raw of ['{','[]','x'.repeat(MAX_SNAPSHOT+1),JSON.stringify([{type:'paragraph',content:[{type:'link',href:'javascript:alert(1)',content:'bad'}]}])]) {
    assert.throws(()=>parseBlockSnapshot(raw));
  }
});
test('rejects media and nested block bombs',()=>{
  assert.throws(()=>parseBlockSnapshot(JSON.stringify([{type:'image',props:{url:'https://example.com/a.png'}}])));
  let block = {type:'paragraph',content:'end'};
  for(let i=0;i<10;i++) block = {type:'paragraph',children:[block]};
  assert.throws(()=>parseBlockSnapshot(JSON.stringify([block])));
});
test('allows safe HTTPS links without credentials',()=>{
  const good=[{type:'paragraph',content:[{type:'link',href:'https://example.com/a',content:'参考'}]}];
  assert.doesNotThrow(()=>parseBlockSnapshot(JSON.stringify(good)));
  good[0].content[0].href='https://user:pw@example.com/';
  assert.throws(()=>parseBlockSnapshot(JSON.stringify(good)));
});
