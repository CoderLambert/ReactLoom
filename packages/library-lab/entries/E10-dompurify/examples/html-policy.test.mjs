import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlPolicy} from './html-policy.mjs';

// These do not import DOMPurify or inspect a real browser DOM.
test('E10 policy: only inert display tags are allowed', () => {
  for (const tag of ['script','style','svg','math','iframe','img','form','object','video']) {
    assert.ok(!htmlPolicy.ALLOWED_TAGS.includes(tag), tag);
  }
  assert.ok(htmlPolicy.ALLOWED_TAGS.includes('strong'));
});
test('E10 policy: restrict attributes to href and title', () => {
  assert.deepEqual(htmlPolicy.ALLOWED_ATTR, ['href','title']);
});
test('E10 policy: reject non-HTTPS and credential-bearing links', () => {
  for (const value of ['javascript:alert(1)','http://example.com/','//example.com/',
    '/internal','https://user:secret@example.com/','data:text/html,hi',
    'https://safe.example@evil.example/']) {
    assert.equal(htmlPolicy.ALLOWED_URI_REGEXP.test(value), false, value);
  }
  assert.equal(htmlPolicy.ALLOWED_URI_REGEXP.test('https://example.com/docs?q=1'), true);
});
