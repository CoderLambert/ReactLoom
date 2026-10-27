import test from 'node:test';
import assert from 'node:assert/strict';
import * as pagefind from 'pagefind';
import {runWorkshop} from '../examples/workshop.mjs';

test.after(async () => {await pagefind.close();});
test('real Pagefind binary indexes HTML and writes a bundle', async () => {
  const result = await runWorkshop('basic');
  assert.equal(result.indexer, 'pagefind Node API');
  assert.equal(result.submittedRecords, 2);
  assert.equal(result.wroteActualBundle, true);
  assert.equal(result.visitorSearchExecuted, false);
  assert.ok(result.fileCount > 0);
  assert.ok(result.bundleBytes > 0);
  assert.ok(result.paths.every(path => !path.includes('private')));
});
test('real Pagefind indexes custom RSS notes without an API server', async () => {
  const result = await runWorkshop('business');
  assert.equal(result.submittedRecords, 4);
  assert.ok(result.fileCount > 0);
  assert.ok(result.bundleBytes > 0);
});
test('real Pagefind scans local generated HTML and cleans native index', async () => {
  const result = await runWorkshop('advanced');
  assert.equal(result.submittedRecords, 5);
  assert.ok(result.paths.some(p => p.endsWith('.js')));
});
