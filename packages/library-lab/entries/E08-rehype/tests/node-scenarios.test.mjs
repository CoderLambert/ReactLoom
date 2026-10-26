import test from 'node:test'
import assert from 'node:assert/strict'
import {rehype} from 'rehype'
import rehypeSanitize from 'rehype-sanitize'
test('real rehype sanitizer removes event handlers, script and unsafe links',()=>{
  const html='<h2 onclick="alert(1)">安全标题</h2><script>alert(2)</script><a href="javascript:alert(3)">链接</a>'
  const result=String(rehype().use(rehypeSanitize).processSync(html))
  assert.match(result,/安全标题/)
  assert.doesNotMatch(result,/onclick=|<script|javascript:/i)
})
test('real rehype keeps basic formatting inside allow-list',()=>{
  const result=String(rehype().use(rehypeSanitize).processSync('<p><strong>ReactLoom</strong> text</p>'))
  assert.match(result,/<strong>ReactLoom<\/strong>/)
})
