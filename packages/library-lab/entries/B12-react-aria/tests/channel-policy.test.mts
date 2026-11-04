import assert from 'node:assert/strict';
import test from 'node:test';
import {confirmedChannel, filterChannels, queryRows} from '../examples/channel-policy.ts';
const rows = [{id: 'react', name: 'React 工程', category: '技术'}, {id: 'news', name: '每日新闻', category: '资讯'}, {id: 'locked', name: '安全通告', category: '技术', disabled: true}];

test('category query matches even without keyword in option name', () => {
  assert.deepEqual(filterChannels(rows, '技术').map(x => x.id), ['react', 'locked']);
});
test('normalizes whitespace and latin casing', () => {
  assert.deepEqual(filterChannels(rows, '  REACT ').map(x => x.id), ['react']);
});
test('pending asynchronous results are hidden', () => {
  assert.deepEqual(queryRows(rows, '新', '旧', false), []);
  assert.deepEqual(queryRows(rows, '技术', '技术', true), []);
  assert.deepEqual(queryRows(rows, '技术', '技术', false).map(x => x.id), ['react', 'locked']);
});
test('only enabled explicitly selected matching title is committed', () => {
  assert.equal(confirmedChannel(rows, 'react', 'React 工程')?.id, 'react');
  assert.equal(confirmedChannel(rows, 'react', '正在输入'), null);
  assert.equal(confirmedChannel(rows, 'locked', '安全通告'), null);
  assert.equal(confirmedChannel(rows, null, 'React 工程'), null);
});
