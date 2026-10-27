import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_SOURCE_BYTES, validateSourceIndex, readBoundedSourceResponse} from '../src/lib/source-integrity.mjs';

const sha = 'a'.repeat(64);
const one = {path:'examples/example.tsx', sha256:sha, bytes:15};
const two = {path:'examples/demo.tsx', sha256:'b'.repeat(64), bytes:10};

test('source index selects declared paths in order without trusting unrelated source entries', () => {
  assert.deepEqual(validateSourceIndex([two, one], [one.path, two.path]), [one,two]);
  assert.deepEqual(validateSourceIndex([two, one], [one.path,one.path]), [one]);
});

test('source index rejects absent, duplicated, tampered, oversized or traversal metadata', () => {
  for (const data of [null, {}, [null], [one,one], [one,{...two,bytes:MAX_SOURCE_BYTES+1}],
    [{...one,sha256:'a'}], [{...one,path:'../secret'}], [{...one,bytes:-1}], [{...one,bytes:1.5}]]) {
    assert.throws(() => validateSourceIndex(data,[one.path]), Error);
  }
  assert.throws(() => validateSourceIndex([one],[two.path]), /缺少/);
  assert.throws(() => validateSourceIndex([one],['../secret']), /格式/);
});

test('source stream preserves multibyte text across chunk boundaries', async () => {
  const bytes = new TextEncoder().encode('A中文\n');
  const response = new Response(new ReadableStream({start(controller) {
    for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
    controller.close();
  }}), {headers:{'content-type':'text/plain'}});
  assert.equal(await readBoundedSourceResponse(response,bytes.length),'A中文\n');
});

test('source stream rejects forged smaller or larger declared byte lengths', async () => {
  await assert.rejects(readBoundedSourceResponse(new Response('12345'),4),/超出/);
  await assert.rejects(readBoundedSourceResponse(new Response('12345'),6),/不一致/);
  await assert.rejects(readBoundedSourceResponse(new Response(''),1),/不一致/);
});

test('source stream rejects fallback HTML, non-200 replies and invalid UTF-8', async () => {
  await assert.rejects(readBoundedSourceResponse(new Response('<html></html>',{headers:{'content-type':'text/html'}}),13),/SPA/);
  await assert.rejects(readBoundedSourceResponse(new Response('missing',{status:404}),7),/读取失败/);
  await assert.rejects(readBoundedSourceResponse(new Response(Uint8Array.of(0xc3,0x28)),2),TypeError);
});

test('source stream accepts empty files and rejects impossible byte expectations', async () => {
  assert.equal(await readBoundedSourceResponse(new Response(''),0),'');
  await assert.rejects(readBoundedSourceResponse(new Response('x'),MAX_SOURCE_BYTES+1),/非法/);
});
