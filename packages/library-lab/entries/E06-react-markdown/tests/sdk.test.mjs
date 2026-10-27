import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {safeMarkdownURL, markdownComponents} from '../examples/render-policy.mjs';

// This suite imports the real SDKs and the exact component/URL policy used by example.tsx.
function render(source) {
  return renderToStaticMarkup(createElement(Markdown, {
    remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSanitize],
    skipHtml: true, urlTransform: safeMarkdownURL,
    components: markdownComponents, children: source,
  }));
}
test('E06 real SDK: basic formatting and safe links', () => {
  const html = render('# Title\n\n**bold** [doc](https://example.com/doc)');
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /href="https:\/\/example.com\/doc"/);
  assert.match(html, /rel="noopener noreferrer"/);
});
test('E06 real SDK: GFM business table', () => {
  const html = render('| Field | Status |\n| --- | --- |\n| Case | PASS |');
  assert.match(html, /<table>/);
  assert.match(html, /<td>PASS<\/td>/);
});
test('E06 real SDK: unsafe links, raw HTML and remote tracking image', () => {
  const html = render('[bad](javascript:alert%281%29) <script>alert(1)</script>\n\n![track](https://example.com/track.png)\n\n[auth](https://name:secret@example.com/)');
  assert.doesNotMatch(html, /<script|<img|javascript:|onerror=|src="https:\/\//i);
  assert.match(html, /图片外链被禁用/);
  assert.doesNotMatch(html, /href="https:\/\/name:secret@/);
});
