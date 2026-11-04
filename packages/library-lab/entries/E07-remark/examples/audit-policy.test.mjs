import test from 'node:test';
import assert from 'node:assert/strict';
import {safeReference,auditMarkdownTree} from './audit-policy.mjs';
test('reject credentials, unsafe protocols and protocol-relative links',()=>{
  for(const value of ['javascript:alert(1)','http://example.org','https://u:p@example.org',
    '//tracker.invalid/a','https://example.org/\nnext','data:text/html,hello','#'])
    assert.equal(safeReference(value),false,value);
  for(const value of ['https://example.org/path','/local/rss','#heading-1'])
    assert.equal(safeReference(value),true,value);
});
test('nested heading and image audit retains text and link order',()=>{
  const tree={type:'root',children:[
    {type:'heading',children:[{type:'strong',children:[{type:'text',value:'重要'}]},
      {type:'text',value:' '},{type:'link',url:'https://example.org',children:[{type:'text',value:'来源'}]}]},
    {type:'image',url:'javascript:alert(1)'}]};
  assert.deepEqual(auditMarkdownTree(tree),{
    headings:['重要 来源'],
    links:[{url:'https://example.org',safe:true},{url:'javascript:alert(1)',safe:false}],
    nodes:8,
  });
});
test('huge AST is rejected before traversal becomes unbounded',()=>{
  const tree={type:'root',children:Array.from({length:4096},()=>({type:'text',value:'x'}))};
  assert.throws(()=>auditMarkdownTree(tree),/4096 nodes/);
});
