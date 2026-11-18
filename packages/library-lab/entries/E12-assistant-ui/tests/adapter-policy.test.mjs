import assert from 'node:assert/strict'
import test from 'node:test'
import { abortableSleep, createLocalAdapter } from '../examples/local-adapter.mjs'

const messages = (text) => [{ role: 'user', content: [{ type: 'text', text }] }]
test('actual local adapter yields cumulative latest-user fixture; this is application policy, not SDK', async () => {
  const session = createLocalAdapter('business'),
    controller = new AbortController(),
    outputs = []
  for await (const chunk of session.adapter.run({
    messages: messages('独立问题'),
    abortSignal: controller.signal,
  }))
    outputs.push(chunk.content[0].text)
  assert.ok(outputs.length > 1)
  assert.ok(outputs.at(-1).includes('独立问题'))
  assert.ok(outputs.every((text, i) => i === 0 || text.startsWith(outputs[i - 1])))
})
test('abort sleep rejects promptly and session cleanup stops pending yield, permits new run', async () => {
  const c = new AbortController(),
    pending = abortableSleep(10000, c.signal)
  c.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  const session = createLocalAdapter('advanced'),
    run = session.adapter.run({
      messages: messages('cancel'),
      abortSignal: new AbortController().signal,
    })
  const next = run.next()
  session.abortAll()
  assert.equal((await next).done, true)
  const fresh = session.adapter.run({
    messages: messages('new'),
    abortSignal: new AbortController().signal,
  })
  const chunk = await fresh.next()
  assert.ok(chunk.value.content[0].text.startsWith('取消与流式实验'))
  session.abortAll()
  await fresh.return()
})
test('simulated failure is an error, later prompt is independent; already-aborted run is empty', async () => {
  const session = createLocalAdapter('basic')
  await assert.rejects(
    session.adapter
      .run({ messages: messages('/error'), abortSignal: new AbortController().signal })
      .next(),
    /模拟失败/,
  )
  const reply = await session.adapter
    .run({ messages: messages('recovered'), abortSignal: new AbortController().signal })
    .next()
  assert.match(reply.value.content[0].text, /recovered/)
  const c = new AbortController()
  c.abort()
  assert.equal(
    (await session.adapter.run({ messages: messages('skip'), abortSignal: c.signal }).next()).done,
    true,
  )
})
