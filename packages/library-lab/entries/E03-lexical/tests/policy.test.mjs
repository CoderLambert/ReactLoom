import test from 'node:test';
import assert from 'node:assert/strict';
import {assertLexicalSnapshot,MAX_SNAPSHOT} from '../examples/snapshot-policy.mjs';

const text = value => ({type:'text',text:value,detail:0,format:0,mode:'normal',style:'',version:1});
const root = children => JSON.stringify({root:{type:'root',version:1,children}});
test('valid paragraph plus text serialized snapshot survives exact',()=>{
  const raw=root([{type:'paragraph',version:1,children:[text('你好'),{type:'linebreak',version:1}]}]);
  assert.equal(assertLexicalSnapshot(raw),raw);
});
test('rejects empty root before setEditorState',()=>{
  for(const raw of ['{','{}',root([]),'x'.repeat(MAX_SNAPSHOT+1)]) assert.throws(()=>assertLexicalSnapshot(raw));
});
test('unknown nodes and nested bombs are rejected',()=>{
  assert.throws(()=>assertLexicalSnapshot(root([{type:'html',children:[]}])));
  assert.throws(()=>assertLexicalSnapshot(root([{type:'paragraph',children:[{type:'text',text:'x',style:'background:url(https://evil.test/)'}]}])));
  assert.throws(()=>assertLexicalSnapshot(root(Array.from({length:401},()=>({type:'paragraph',children:[]})))));
});
