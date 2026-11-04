import assert from 'node:assert/strict'
import test from 'node:test'
import { JSON_RESPONSE_LIMITS, readLimitedJsonResponse } from '../src/lib/bounded-json.mjs'

const json = (value) =>
  new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
test('generated catalogue, detail and source indexes have independent byte ceilings', () => {
  assert.ok(JSON_RESPONSE_LIMITS.catalogIndex >= JSON_RESPONSE_LIMITS.sourceIndex)
  assert.ok(JSON_RESPONSE_LIMITS.catalogDetail >= JSON_RESPONSE_LIMITS.sourceIndex)
  assert.ok(JSON_RESPONSE_LIMITS.sourceIndex > 0)
})
test('valid JSON and split UTF-8 code points survive streaming', async () => {
  const expected = { title: '中文 😀', items: [1, 2, 3] }
  const source = new TextEncoder().encode(JSON.stringify(expected))
  const response = new Response(
    new ReadableStream({
      start(controller) {
        for (const byte of source) controller.enqueue(Uint8Array.of(byte))
        controller.close()
      },
    }),
    { headers: { 'content-type': 'application/json', 'content-length': '1' } },
  )
  assert.deepEqual(await readLimitedJsonResponse(response, source.byteLength), expected)
  assert.deepEqual(await readLimitedJsonResponse(json({ ok: true }), 100), { ok: true })
})
test('oversized decompressed JSON cancels the stream despite forged content-length', async () => {
  let cancelled = false
  const response = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(' '.repeat(500)))
      },
      cancel() {
        cancelled = true
      },
    }),
    { headers: { 'content-type': 'application/json', 'content-length': '1' } },
  )
  await assert.rejects(readLimitedJsonResponse(response, 100), /超过字节安全上限/u)
  assert.equal(cancelled, true)
})
test('HTML fallback, HTTP failures, absent body and invalid byte budgets fail closed', async () => {
  await assert.rejects(
    readLimitedJsonResponse(
      new Response('<html/>', { headers: { 'content-type': 'text/html' } }),
      100,
    ),
    /SPA/u,
  )
  await assert.rejects(
    readLimitedJsonResponse(
      new Response('{"ok":true}', { headers: { 'content-type': 'text/plain' } }),
      100,
    ),
    /资源类型/u,
  )
  await assert.rejects(
    readLimitedJsonResponse(
      new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } }),
      100,
    ),
    /读取失败/u,
  )
  await assert.rejects(
    readLimitedJsonResponse(
      new Response(null, { headers: { 'content-type': 'application/json' } }),
      100,
    ),
    /字节流/u,
  )
  await assert.rejects(readLimitedJsonResponse(json({ ok: true }), 0), RangeError)
})
test('malformed JSON, broken UTF-8 and length underbudget are not accepted', async () => {
  await assert.rejects(
    readLimitedJsonResponse(
      new Response('{not json}', { headers: { 'content-type': 'application/json' } }),
      100,
    ),
    SyntaxError,
  )
  await assert.rejects(
    readLimitedJsonResponse(
      new Response(Uint8Array.of(0xc3, 0x28), { headers: { 'content-type': 'application/json' } }),
      100,
    ),
    TypeError,
  )
  await assert.rejects(
    readLimitedJsonResponse(json({ large: 'x'.repeat(500) }), 100),
    /超过字节安全上限/u,
  )
})
test('structured application plus-json MIME remains supported', async () => {
  const response = new Response('{"error":"example"}', {
    headers: { 'content-type': 'application/problem+json' },
  })
  assert.deepEqual(await readLimitedJsonResponse(response, 100), { error: 'example' })
})
