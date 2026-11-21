import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSessionBoundRequest } from '../src/features/tasks/session-request.ts'

function sessionHarness() {
  let active = true
  const listeners = new Set()
  return {
    isCurrent: () => active,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    replace: () => {
      active = false
      for (const listener of [...listeners]) listener()
    },
    notify: () => {
      for (const listener of [...listeners]) listener()
    },
    listenerCount: () => listeners.size,
  }
}

test('cancels an in-flight task write as soon as its initiating session changes', async () => {
  const session = sessionHarness()
  let sentSignal
  const pending = runSessionBoundRequest(session.isCurrent, session.subscribe, (signal) => {
    sentSignal = signal
    return new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    })
  })
  assert.equal(session.listenerCount(), 1)
  assert.equal(sentSignal.aborted, false)
  session.replace()
  assert.equal(sentSignal.aborted, true)
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(session.listenerCount(), 0)
})

test('does not send a write if the session changed immediately before subscription', async () => {
  const session = sessionHarness()
  session.replace()
  let sent = false
  await assert.rejects(
    runSessionBoundRequest(session.isCurrent, session.subscribe, async () => {
      sent = true
    }),
    { name: 'AbortError' },
  )
  assert.equal(sent, false)
  assert.equal(session.listenerCount(), 0)
})

test('closes the subscribe/check gap if the session changes while subscribing', async () => {
  const session = sessionHarness()
  let sent = false
  await assert.rejects(
    runSessionBoundRequest(
      session.isCurrent,
      (listener) => {
        const unsubscribe = session.subscribe(listener)
        session.replace()
        return unsubscribe
      },
      async () => {
        sent = true
      },
    ),
    { name: 'AbortError' },
  )
  assert.equal(sent, false)
  assert.equal(session.listenerCount(), 0)
})

test('ignores unrelated notifications and releases subscription after success', async () => {
  const session = sessionHarness()
  let signal
  const result = await runSessionBoundRequest(session.isCurrent, session.subscribe, async (s) => {
    signal = s
    session.notify()
    return 'saved'
  })
  assert.equal(result, 'saved')
  assert.equal(signal.aborted, false)
  assert.equal(session.listenerCount(), 0)
  session.replace()
  assert.equal(signal.aborted, false)
})

test('releases its subscription when a request rejects for another reason', async () => {
  const session = sessionHarness()
  const failure = new Error('offline')
  await assert.rejects(
    runSessionBoundRequest(session.isCurrent, session.subscribe, async () => {
      throw failure
    }),
    (error) => error === failure,
  )
  assert.equal(session.listenerCount(), 0)
})
