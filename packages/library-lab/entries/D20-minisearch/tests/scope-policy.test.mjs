import test from 'node:test';
import assert from 'node:assert/strict';
import {scopeSearchDocuments} from '../examples/scope-policy.mjs';
const documents = Object.freeze([
  Object.freeze({id: 't', group: '技术', title: 'React 技术文档'}),
  Object.freeze({id: 'p', group: '产品', title: '敏感产品词条'}),
  Object.freeze({id: 'o', group: '开源', title: '开放项目'}),
]);
test('index input is category-scoped before search or suggestion', () => {
  assert.deepEqual(scopeSearchDocuments(documents, '技术').map(doc => doc.id), ['t']);
  assert.deepEqual(scopeSearchDocuments(documents, '产品').map(doc => doc.id), ['p']);
  assert.deepEqual(scopeSearchDocuments(documents, '开源').map(doc => doc.id), ['o']);
});
test('unknown group is empty and all-group does not mutate source', () => {
  assert.deepEqual(scopeSearchDocuments(documents, '未知'), []);
  const all = scopeSearchDocuments(documents, '全部');
  assert.deepEqual(all.map(doc => doc.id), ['t','p','o']);
  assert.notEqual(all, documents);
  all.pop();
  assert.equal(documents.length, 3);
});
