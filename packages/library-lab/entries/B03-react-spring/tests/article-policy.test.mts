import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_SPRING_ARTICLES,appendUniqueArticle,focusDestinationAfterRemoval} from '../examples/article-policy.ts';

test('append preserves unique business identities', () => {
  assert.deepEqual(appendUniqueArticle([{id:'a'}],{id:'b'}),[{id:'a'},{id:'b'}]);
  assert.deepEqual(appendUniqueArticle([{id:'a'}],{id:'a'}),[{id:'a'}]);
});
test('bounded list rejects 13th article without mutating current items', () => {
  const original=Array.from({length:MAX_SPRING_ARTICLES},(_,i)=>({id:String(i)}));
  const next=appendUniqueArticle(original,{id:'13'});
  assert.deepEqual(next,original);
  assert.equal(original.length,MAX_SPRING_ARTICLES);
});
test('removing a button that did not own focus must not steal focus', () => {
  assert.equal(focusDestinationAfterRemoval(false,3),'none');
  assert.equal(focusDestinationAfterRemoval(true,3),'add');
  assert.equal(focusDestinationAfterRemoval(true,MAX_SPRING_ARTICLES),'reset');
});
