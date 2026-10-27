import test from 'node:test';
import assert from 'node:assert/strict';
import {recentUserText,makeLocalReply,cumulativeChunks} from './reply-policy.mjs';
test('uses latest user text only; ignores tool and assistant content',()=>{
  assert.equal(recentUserText([{role:'user',content:[{type:'text',text:'旧'}]},
    {role:'assistant',content:[{type:'text',text:'秘密'}]},
    {role:'user',content:[{type:'tool-call',args:{key:'x'}},{type:'text',text:'新问题'}]}]), '新问题');
});
test('bounds unicode input to 160 codepoints, removes control characters',()=>{
  const text='😀'.repeat(180)+'\u0000';
  assert.equal(Array.from(recentUserText([{role:'user',content:[{type:'text',text}]}])).length,160);
});
test('formats deterministic offline response without claiming AI/RSS retrieval',()=>{
  assert.match(makeLocalReply([{role:'user',content:[{type:'text',text:'React测试'}]}],'business'),/没有检索实时新闻/);
  assert.match(makeLocalReply([], 'basic'),/没有可处理/);
  assert.throws(()=>makeLocalReply([], 'secret'),/未知/);
});
test('streaming yields cumulative exact unicode text, not deltas',()=>{
  assert.deepEqual(cumulativeChunks('甲乙丙丁戊',2),['甲乙','甲乙丙丁','甲乙丙丁戊']);
  assert.deepEqual(cumulativeChunks('😀文',1),['😀','😀文']);
  assert.deepEqual(cumulativeChunks('',3),[]);
  assert.throws(()=>cumulativeChunks('x',0),/chunk/);
});
