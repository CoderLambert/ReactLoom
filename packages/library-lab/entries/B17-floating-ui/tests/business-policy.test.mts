import test from 'node:test';
import assert from 'node:assert/strict';
import {ARTICLE_TITLES, filterArticleTitles, toggleArticleAction} from '../examples/business-policy.ts';

test('saved and read actions each toggle only their own property', () => {
  const initial = {saved: false, read: false};
  const saved = toggleArticleAction(initial, 'saved');
  assert.deepEqual(saved, {saved: true, read: false});
  assert.deepEqual(toggleArticleAction(saved, 'read'), {saved: true, read: true});
  assert.deepEqual(toggleArticleAction(saved, 'saved'), initial);
  assert.deepEqual(initial, {saved: false, read: false});
});
test('empty search returns all local articles', () => {
  assert.deepEqual(filterArticleTitles(ARTICLE_TITLES, '   '), [...ARTICLE_TITLES]);
});
test('multiple search terms require each term and preserve order', () => {
  assert.deepEqual(filterArticleTitles(ARTICLE_TITLES, '  Floating 滚动 '), ['Floating UI 视口碰撞与滚动']);
  assert.deepEqual(filterArticleTitles(ARTICLE_TITLES, 'React 不存在'), []);
});
test('Unicode compatible width and case are normalized for business filtering', () => {
  assert.deepEqual(filterArticleTitles(['Ｆｌｏａｔｉｎｇ UI', 'Other'], 'floating'), ['Ｆｌｏａｔｉｎｇ UI']);
});
test('query and source titles remain unchanged after filtering', () => {
  const titles = ['ABC', 'Abd'];
  filterArticleTitles(titles, 'ab');
  assert.deepEqual(titles, ['ABC', 'Abd']);
});
