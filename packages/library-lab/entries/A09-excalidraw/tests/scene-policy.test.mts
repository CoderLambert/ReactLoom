import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { isSafeSceneLink, sceneImportError } from '../examples/scene-policy.ts';

const valid = { name: 'scene.excalidraw', bytes: 1024, elementCount: 3, links: ['https://example.org/story'] };
test('safe URL policy accepts empty/HTTPS and rejects script, HTTP and credential URLs', () => {
  assert.equal(isSafeSceneLink(null), true);
  assert.equal(isSafeSceneLink('https://example.org/story'), true);
  for (const url of ['javascript:alert(1)', 'data:text/html,evil', 'http://example.org', 'https://user:pass@example.org', '//example.org', 'not a URL'])
    assert.equal(isSafeSceneLink(url), false, url);
});
test('valid scene, filename case and document-only links', () => {
  assert.equal(sceneImportError(valid), null);
  assert.equal(sceneImportError({ ...valid, name: 'CASE.JSON' }), null);
});
test('empty, oversized or malformed file rejected', () => {
  for (const bytes of [0, 1_500_001, -1, NaN, 1.1])
    assert.match(sceneImportError({ ...valid, bytes })!, /1.5 MB/);
  assert.match(sceneImportError({ ...valid, name: 'payload.svg' })!, /仅接受/);
});
test('invalid elements, dangerous links, binary attachments rejected', () => {
  for (const elementCount of [-1, 201, 0.3])
    assert.match(sceneImportError({ ...valid, elementCount })!, /200/);
  assert.match(sceneImportError({ ...valid, links: ['http://insecure.example'] })!, /HTTPS/);
  assert.match(sceneImportError({ ...valid, attachedFiles: 1 })!, /二进制/);
});
