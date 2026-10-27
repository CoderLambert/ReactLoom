import test from 'node:test';
import assert from 'node:assert/strict';
import {assertDraftText,MAX_DRAFT} from '../examples/draft-policy.mjs';

test('keeps valid TypeScript, Chinese and whitespace exactly',()=>{
  const value='const 名称 = "新闻";\n\tconsole.log(名称)\n';
  assert.equal(assertDraftText(value),value);
});
test('accepts exact boundary but rejects oversized restore',()=>{
  assert.equal(assertDraftText('x'.repeat(MAX_DRAFT)).length,MAX_DRAFT);
  assert.throws(()=>assertDraftText('x'.repeat(MAX_DRAFT+1)));
});
test('rejects null bytes and non-string storage content',()=>{
  assert.throws(()=>assertDraftText('a\0b'));
  assert.throws(()=>assertDraftText(null));
});
