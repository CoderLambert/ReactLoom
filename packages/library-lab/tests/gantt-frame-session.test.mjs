import assert from 'node:assert/strict'
import test from 'node:test'

const session = '01234567-89ab-4cde-8fab-0123456789ab'
async function api() {
  let value
  try {
    value = await import('../src/lib/gantt-frame-session.mjs')
  } catch {}
  assert.equal(typeof value?.createGanttFrameSession, 'function')
  return value
}
function fixture(origin = 'http://127.0.0.1:4319') {
  const listeners = new Set(),
    timers = new Set(),
    events = [],
    sent = []
  const frame = {
    style: {},
    setAttribute() {},
    contentWindow: { postMessage: (...args) => sent.push(args) },
    remove() {
      this.removed = true
    },
  }
  const host = {
    location: { origin },
    crypto: { randomUUID: () => session },
    document: { createElement: () => frame },
    addEventListener: (_, callback) => listeners.add(callback),
    removeEventListener: (_, callback) => listeners.delete(callback),
    setTimeout: (callback) => {
      timers.add(callback)
      return callback
    },
    clearTimeout: (timer) => timers.delete(timer),
  }
  const container = { ownerDocument: host.document, appendChild: () => {} }
  const packet = (type, rest = {}) => ({
    protocol: 'reactloom-gantt-v1',
    session,
    type,
    ...rest,
  })
  const send = (data, origin = 'http://127.0.0.1:4321', source = frame.contentWindow) => {
    for (const callback of [...listeners]) callback({ data, origin, source })
  }
  return {
    host,
    container,
    frame,
    listeners,
    timers,
    events,
    sent,
    packet,
    send,
  }
}
test('only the fixed C13 canonical scenarios are registered', async () => {
  const { isRegisteredGanttDemo } = await api()
  const demo = {
    demoId: 'basic',
    level: 'basic',
    executionKind: 'browser-frame',
    entryPoint: 'examples/demo.tsx',
  }
  assert.equal(isRegisteredGanttDemo('C13', demo), true)
  for (const [id, value] of [
    ['F11', demo],
    ['C13', { ...demo, entryPoint: 'examples/other.tsx' }],
    ['C13', { ...demo, level: 'advanced' }],
    ['C13', { ...demo, capabilities: ['service-worker'] }],
  ])
    assert.equal(isRegisteredGanttDemo(id, value), false)
})
test('the child start schema accepts only a UUID and one finite level without extra capabilities', async () => {
  const { isGanttPacket } = await api(),
    f = fixture()
  assert.equal(isGanttPacket(f.packet('start', { level: 'basic' }), session, 'start'), true)
  for (const data of [
    f.packet('start', { level: 'shell' }),
    f.packet('start', { level: 'basic', url: 'https://attacker.invalid' }),
    f.packet('running'),
    [],
    null,
  ])
    assert.equal(isGanttPacket(data, session, 'start'), false)
  assert.equal(isGanttPacket(f.packet('start', { level: 'basic' }), 'wrong', 'start'), false)
})
test('origin/source/session and finite messages gate start and running', async () => {
  const { createGanttFrameSession } = await api(),
    f = fixture()
  const run = createGanttFrameSession({
    window: f.host,
    container: f.container,
    level: 'business',
    onEvent: (event) => f.events.push(event),
  })
  f.send(f.packet('ready'), 'https://attacker.invalid')
  f.send(f.packet('ready'), undefined, {})
  f.send({ ...f.packet('ready'), session: 'wrong' })
  f.send(f.packet('ready', { code: 'evil' }))
  assert.equal(f.sent.length, 0)
  f.send(f.packet('running'))
  assert.equal(
    f.events.some((event) => event.type === 'running'),
    false,
  )
  f.send(f.packet('ready'))
  f.send(f.packet('ready'))
  assert.deepEqual(f.sent, [[f.packet('start', { level: 'business' }), 'http://127.0.0.1:4321']])
  f.send(f.packet('running'))
  assert.equal(f.events.at(-1).type, 'running')
  assert.equal(f.timers.size, 0)
  run.dispose()
  run.dispose()
  assert.equal(f.frame.removed, true)
  assert.equal(f.listeners.size, 0)
  assert.equal(f.timers.size, 0)
  const length = f.events.length
  f.send(f.packet('running'))
  assert.equal(f.events.length, length)
})
test('stop before ready immediately destroys its frame without a cleanup ACK', async () => {
  const { createGanttFrameSession } = await api(),
    f = fixture()
  const run = createGanttFrameSession({
    window: f.host,
    container: f.container,
    level: 'basic',
    onEvent: (event) => f.events.push(event),
  })
  run.dispose()
  f.send(f.packet('ready'))
  assert.equal(f.frame.removed, true)
  assert.equal(f.sent.length, 0)
  assert.equal(f.listeners.size, 0)
  assert.equal(f.timers.size, 0)
  assert.equal(f.events.at(-1).type, 'closed')
})
test('startup timeout and bounded errors close the actual owned frame', async () => {
  const { createGanttFrameSession } = await api()
  for (const type of ['timeout', 'error']) {
    const f = fixture()
    createGanttFrameSession({
      window: f.host,
      container: f.container,
      level: 'advanced',
      onEvent: (event) => f.events.push(event),
    })
    if (type === 'timeout') [...f.timers][0]()
    else {
      f.send(f.packet('error', { message: 'x'.repeat(501) }))
      assert.equal(f.frame.removed, undefined)
      f.send(f.packet('error', { message: 'SDK failed' }))
    }
    assert.equal(f.frame.removed, true)
    assert.equal(f.events.at(-1).type, 'error')
    assert.equal(f.listeners.size, 0)
    assert.equal(f.timers.size, 0)
  }
})
test('localhost uses its matching fixed authority and other origins/levels fail closed', async () => {
  const { createGanttFrameSession } = await api()
  const local = fixture('http://localhost:4319')
  const run = createGanttFrameSession({
    window: local.host,
    container: local.container,
    level: 'basic',
    onEvent: () => {},
  })
  assert.equal(local.frame.src, `http://localhost:4321/lab-runners/gantt/sessions/${session}/`)
  run.dispose()
  for (const origin of [
    'https://localhost:4319',
    'http://127.0.0.2:4319',
    'http://evil.localhost:4319',
    'http://localhost:4321',
  ]) {
    const f = fixture(origin)
    assert.throws(() =>
      createGanttFrameSession({
        window: f.host,
        container: f.container,
        level: 'basic',
        onEvent: () => {},
      }),
    )
  }
  const f = fixture()
  assert.throws(() =>
    createGanttFrameSession({
      window: f.host,
      container: f.container,
      level: 'shell',
      onEvent: () => {},
    }),
  )
})
