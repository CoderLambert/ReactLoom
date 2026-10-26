import test from 'node:test';
import assert from 'node:assert/strict';
import {extractDocumentHeadings,resolveDocumentUrl} from '../src/lib/document-utils.mjs';

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
    ['section-1','Title'],['section-5','Part'],['section-9','中文指南'],
  ]);
});
