import assert from 'node:assert/strict'
import test from 'node:test'
import { createPreviewSession } from './preview-session.mjs'

const delayed = () => {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  return {
    file: {
      size: 3,
      slice() {
        return { arrayBuffer: () => promise }
      },
    },
    resolve: (text) => resolve(new TextEncoder().encode(text).buffer),
  }
}
test('new read owns result; stale completion is ignored rather than physically cancelled', async () => {
  const session = createPreviewSession(),
    old = delayed(),
    latest = delayed(),
    values = []
  const a = session.read(
    old.file,
    (text) => values.push(text),
    () => {},
  )
  const b = session.read(
    latest.file,
    (text) => values.push(text),
    () => {},
  )
  latest.resolve('new')
  await b
  old.resolve('old')
  await a
  assert.deepEqual(values, ['new'])
})
test('clear/unmount invalidation suppresses pending read and permits later session use', async () => {
  const session = createPreviewSession(),
    pending = delayed(),
    values = []
  const run = session.read(
    pending.file,
    (text) => values.push(text),
    () => {},
  )
  session.invalidate()
  pending.resolve('old')
  await run
  assert.deepEqual(values, [])
  await session.read(
    new Blob(['fresh']),
    (text) => values.push(text),
    () => {},
  )
  assert.deepEqual(values, ['fresh'])
})

test('active read errors are reported and a later valid read recovers', async () => {
  const session = createPreviewSession(),
    errors = [],
    values = []
  await session.read(
    {
      size: 3,
      slice() {
        return {
          arrayBuffer: async () => {
            throw Error('fixture read error')
          },
        }
      },
    },
    (text) => values.push(text),
    (error) => errors.push(String(error)),
  )
  assert.match(errors[0], /fixture read error/)
  await session.read(
    new Blob(['recovered']),
    (text) => values.push(text),
    () => {},
  )
  assert.deepEqual(values, ['recovered'])
})
