import * as Y from 'yjs'
import { validateYjsEnvelope } from './update-transport.mjs'
export type Replica = { left: Y.Doc; right: Y.Doc }
export type View = {
  left: Record<string, unknown>
  right: Record<string, unknown>
  leftTitle: string
  rightTitle: string
}
export const empty: View = { left: {}, right: {}, leftTitle: '', rightTitle: '' }
const demoScope = { tenantId: 'demo-only-tenant', documentId: 'rss-shared-map' }
function envelope(update: Uint8Array) {
  return { ...demoScope, format: 'yjs-v1', update }
}
export function inspect(pair: Replica): View {
  return {
    left: pair.left.getMap('feeds').toJSON(),
    right: pair.right.getMap('feeds').toJSON(),
    leftTitle: (pair.left.getMap('meta').get('title') as string) ?? '',
    rightTitle: (pair.right.getMap('meta').get('title') as string) ?? '',
  }
}
export function createReplicaRuntime() {
  const left = new Y.Doc(),
    right = new Y.Doc()
  const pair = { left, right }
  const pending: { left: Uint8Array[]; right: Uint8Array[] } = { left: [], right: [] }
  let transactions = 0
  let nextId = 0
  let destroyed = false
  const onLeft = (update: Uint8Array, origin: unknown) => {
    if (origin === 'demo-local') pending.left.push(update)
  }
  const onRight = (update: Uint8Array, origin: unknown) => {
    if (origin === 'demo-local') pending.right.push(update)
  }
  left.on('update', onLeft)
  right.on('update', onRight)
  function ensureAlive() {
    if (destroyed) throw new Error('Replica runtime destroyed')
  }
  return {
    ...pair,
    add(which: 'left' | 'right') {
      ensureAlive()
      const id = ++nextId
      pair[which].transact(() => {
        pair[which].getMap('feeds').set(`${which}-${id}`, {
          title: which === 'left' ? '前端实践' : '国际新闻',
          updatedBy: which,
        })
        pair[which].getMap('meta').set('lastEditor', which)
      }, 'demo-local')
      transactions++
    },
    conflict() {
      ensureAlive()
      left.transact(() => left.getMap('meta').set('title', 'A 的标题'), 'demo-local')
      right.transact(() => right.getMap('meta').set('title', 'B 的标题'), 'demo-local')
      transactions += 2
    },
    sync(replay = false) {
      ensureAlive()
      const replayedUpdates = replay ? pending.left.length + pending.right.length : 0
      // Capture BOTH deltas before changing either document.
      const ab = validateYjsEnvelope(
        envelope(Y.encodeStateAsUpdate(left, Y.encodeStateVector(right))),
        demoScope,
      )
      const ba = validateYjsEnvelope(
        envelope(Y.encodeStateAsUpdate(right, Y.encodeStateVector(left))),
        demoScope,
      )
      if (replay) {
        // Deliver dependent updates newest-first, then replay them. Missing dependencies are buffered by Yjs.
        for (const bytes of [...pending.left].reverse())
          Y.applyUpdate(right, validateYjsEnvelope(envelope(bytes), demoScope), 'demo-replay')
        for (const bytes of [...pending.right].reverse())
          Y.applyUpdate(left, validateYjsEnvelope(envelope(bytes), demoScope), 'demo-replay')
      }
      Y.applyUpdate(right, ab, 'demo-sync')
      Y.applyUpdate(left, ba, 'demo-sync')
      if (replay) {
        Y.applyUpdate(right, ab, 'demo-replay')
        Y.applyUpdate(left, ba, 'demo-replay')
      }
      pending.left = []
      pending.right = []
      return { bytesToRight: ab.byteLength, bytesToLeft: ba.byteLength, replayedUpdates }
    },
    rejectWrongScope() {
      ensureAlive()
      const update = Y.encodeStateAsUpdate(left)
      // Deliberate application-layer failure, before touching either target document.
      validateYjsEnvelope({ ...envelope(update), documentId: 'other-document' }, demoScope)
    },
    inspect() {
      ensureAlive()
      return { ...inspect(pair), transactions, pending: pending.left.length + pending.right.length }
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      left.off('update', onLeft)
      right.off('update', onRight)
      pending.left = []
      pending.right = []
      left.destroy()
      right.destroy()
    },
  }
}
