import test from 'node:test'
import assert from 'node:assert/strict'
import {rehype} from 'rehype'
import rehypeSanitize from 'rehype-sanitize'
import {strictHtmlSchema} from '../examples/sanitize-policy.mjs'
test('real rehype sanitizer removes event handlers, script and unsafe links',()=>{
  const html='<h2 onclick="alert(1)">安全标题</h2><script>alert(2)</script><a href="javascript:alert(3)">链接</a>'
  const result=String(rehype().use(rehypeSanitize, strictHtmlSchema).processSync(html))
  assert.match(result,/安全标题/)
  assert.doesNotMatch(result,/onclick=|<script|javascript:/i)
})
test('real rehype keeps basic formatting inside allow-list',()=>{
  const result=String(rehype().use(rehypeSanitize, strictHtmlSchema).processSync('<p><strong>ReactLoom</strong> text</p>'))
  assert.match(result,/<strong>ReactLoom<\/strong>/)
})

test('real SDK strictly removes remote assets and all navigable attributes',()=>{
  const html='<article><a href="https://example.org" target="_blank">新闻</a>' +
    '<img src="https://tracker.invalid/p.gif" onerror="alert(1)">' +
    '<iframe src="https://example.org"></iframe><form action="/upload"></form>' +
    '<style>@import url(https://tracker.invalid/style)</style></article>';
  const result=String(rehype().use(rehypeSanitize,strictHtmlSchema).processSync(html));
  assert.match(result,/新闻/);
  assert.doesNotMatch(result,/<img|<iframe|<form|<style|href=|src=|onerror=|action=/i);
});
