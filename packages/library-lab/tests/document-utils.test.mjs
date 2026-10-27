import test from 'node:test';
import assert from 'node:assert/strict';
import {extractDocumentHeadings,resolveDocumentUrl,slugHeading,MAX_MARKDOWN_BYTES,readLimitedMarkdownResponse} from '../src/lib/document-utils.mjs';

test('only safe HTTPS, fragments and same-entry relative files are accepted', () => {
  assert.equal(resolveDocumentUrl('https://example.com/doc', 'A01'), 'https://example.com/doc');
  assert.equal(resolveDocumentUrl('guide.md', 'A01', '/lab/'), '/lab/raw/A01/guide.md');
  assert.equal(resolveDocumentUrl('./assets/example.png', 'F02'), '/raw/F02/assets/example.png');
  assert.equal(resolveDocumentUrl('#section-2', 'E05'), '#section-2');
  for (const url of ['javascript:alert(1)', 'data:text/html,x', '//evil.test/z', '../secrets', './a/../b', 'a\\b', 'x?token=s', 'http://bad.test/x', 'https://user:secret@example.com/doc', 'https://safe.example@evil.example/docs', 'https://reader@example.com/docs']) {
    assert.equal(resolveDocumentUrl(url, 'A01'), '', `Unsafe URL accepted: ${url}`);
  }
});

test('headings ignore fenced blocks and correctly preserve source line anchor', () => {
  const doc = '# Title\n```md\n## Fake\n```\n## Part\n~~~sh\n# shell comment\n~~~\n### 中文指南 ###\n> ## quoted\n';
  assert.deepEqual(extractDocumentHeadings(doc).map(({id,title}) => [id,title]), [
    ['title','Title'],['part','Part'],['中文指南','中文指南'],
  ]);
});

test('Chinese anchors, inline code and duplicate headings exclude fenced content',()=>{
 assert.equal(slugHeading('使用 `AbortSignal` 配置'),'使用-abortsignal-配置');
 const doc='## 安装与配置\n## 安装与配置\n\n```md\n## 假标题\n```\n> ## 引用标题\n### 使用 `AbortSignal` 配置';
 const headings=extractDocumentHeadings(doc);
 assert.deepEqual(headings.map(h=>h.id),['安装与配置','安装与配置-1','使用-abortsignal-配置']);
 assert.equal(headings[2].line,8);
});


test('local example and test links map to real generated source files, not missing SPA fallbacks', () => {
  assert.equal(resolveDocumentUrl('examples/example.tsx', 'D03'), '/raw/D03/sources/examples/example.tsx');
  assert.equal(resolveDocumentUrl('./examples/demo.tsx#Usage', 'A01', '/lab/'), '/lab/raw/A01/sources/examples/demo.tsx#Usage');
  assert.equal(resolveDocumentUrl('tests/sdk.test.mjs', 'F11'), '/raw/F11/sources/tests/sdk.test.mjs');
  assert.equal(resolveDocumentUrl('agent.md', 'B02'), '/raw/B02/agent.md');
  for (const value of ['package.json','AGENTS.md','config.env','README.md','notes.html','assets/tracker.svg','assets/javascript.js','examples/secret.sh','examples/../../secret.ts','examples/%2e%2e/secret.ts']) {
    assert.equal(resolveDocumentUrl(value, 'A01'), '', 'Unexpected local public path: ' + value);
  }
});


test('Markdown byte ceiling preserves split multibyte UTF-8 without trusting response length', async () => {
  const expected='# 文档\\nemoji 😀';
  const bytes=new TextEncoder().encode(expected);
  const response=new Response(new ReadableStream({start(controller) {
    for(const byte of bytes) controller.enqueue(Uint8Array.of(byte));
    controller.close();
  }}), {headers:{'content-type':'text/markdown','content-length':'1'}});
  assert.equal(await readLimitedMarkdownResponse(response),expected);
});

test('Markdown byte ceiling rejects oversized decoded body and cancels the reader', async () => {
  let cancelled=false;
  const source=new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(MAX_MARKDOWN_BYTES+1)); },
    cancel() { cancelled=true; },
  });
  const response=new Response(source,{headers:{'content-type':'text/markdown','content-length':'10'}});
  await assert.rejects(readLimitedMarkdownResponse(response),/2 MB/);
  assert.equal(cancelled,true);
});

test('Markdown rejects fallback HTML, non-2xx, invalid UTF-8 and absent response bodies', async () => {
  await assert.rejects(readLimitedMarkdownResponse(new Response('<html/>',{headers:{'content-type':'text/html; charset=utf-8'}})),/SPA/);
  await assert.rejects(readLimitedMarkdownResponse(new Response('not found',{status:404})),/原文未生成/);
  await assert.rejects(readLimitedMarkdownResponse(new Response(Uint8Array.of(0xc3,0x28))),TypeError);
  await assert.rejects(readLimitedMarkdownResponse(new Response(null)),/字节流/);
});


test('Setext headings use source start lines and duplicate slugs match rendered anchors', () => {
  const doc=['Introduction','============','## 中英对照','中英对照','---','中文标题','----'].join('\n');
  assert.deepEqual(extractDocumentHeadings(doc).map(h=>[h.id,h.depth,h.line]),[
    ['introduction',1,1],['中英对照',2,3],['中英对照-1',2,4],['中文标题',2,6],
  ]);
});

test('Fence-looking code text cannot expose hidden headings; indented/quoted code stays out of TOC', () => {
  const ticks='\x60'.repeat(3);
  const doc=[ticks+'md',ticks+' not a closing fence','## hidden',ticks,
    '    ## indent','\t## tab','> ## quote','- item','---','## visible'].join('\n');
  assert.deepEqual(extractDocumentHeadings(doc).map(h=>h.id),['visible']);
});

test('Document-relative links reject scheme-relative or malformed Vite base paths', () => {
  for (const base of ['//attacker.example/', '/nested//route/', '/a/../b/', '/a?x=1/', '/a#frag', '/a\\backslash/']) {
    assert.equal(resolveDocumentUrl('guide.md','A01',base), '/raw/A01/guide.md',base);
  }
  assert.equal(resolveDocumentUrl('guide.md','A01','/docs.v2/library/'), '/docs.v2/library/raw/A01/guide.md');
});
