import test from 'node:test';
import assert from 'node:assert/strict';
import {extractDocumentHeadings,resolveDocumentUrl,slugHeading} from '../src/lib/document-utils.mjs';

test('only safe HTTPS, fragments and same-entry relative files are accepted', () => {
  assert.equal(resolveDocumentUrl('https://example.com/doc', 'A01'), 'https://example.com/doc');
  assert.equal(resolveDocumentUrl('guide.md', 'A01', '/lab/'), '/lab/raw/A01/guide.md');
  assert.equal(resolveDocumentUrl('./assets/example.png', 'F02'), '/raw/F02/assets/example.png');
  assert.equal(resolveDocumentUrl('#section-2', 'E05'), '#section-2');
  for (const url of ['javascript:alert(1)', 'data:text/html,x', '//evil.test/z', '../secrets', './a/../b', 'a\\b', 'x?token=s', 'http://bad.test/x']) {
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
