import assert from 'node:assert/strict'
import { parentPort, workerData } from 'node:worker_threads'
import {
  createShapeId,
  createTLStore,
  GeoShapeUtil,
  getSnapshot,
  loadSnapshot,
  toRichText,
} from 'tldraw'

function makeStore() {
  const store = createTLStore()
  loadSnapshot(store, { document: store.getStoreSnapshot() })
  return store
}

/**
 * @param {import('tldraw').TLStore} store
 * @param {import('tldraw').TLShapeId} id
 * @param {string} label
 */
function putGeo(store, id, label) {
  const page = store.allRecords().find((record) => record.typeName === 'page')
  assert.ok(page)
  const shape = store.schema.types.shape.create({
    id,
    type: 'geo',
    parentId: page.id,
    index: 'a1',
    props: { ...GeoShapeUtil.prototype.getDefaultProps(), richText: toRichText(label) },
  })
  store.put([shape])
  return shape
}

// This worker owns the SDK import and any SDK-global resources it creates.
// Successful assertions are reported before the parent terminates only this worker.
const store = makeStore()
try {
  switch (workerData.scenario) {
    case 'restore': {
      const id = createShapeId('saved-rss')
      const before = putGeo(store, id, 'RSS 获取')
      const saved = structuredClone(store.getStoreSnapshot())
      store.update(id, (record) => ({ ...record, x: 400 }))
      const laterId = createShapeId('later-rss')
      putGeo(store, laterId, '后来新增')
      const moved = store.get(id)
      assert.ok(moved)
      assert.equal(moved.x, 400)
      loadSnapshot(store, { document: structuredClone(saved) })
      assert.equal(store.get(laterId), undefined)
      const restored = store.get(id)
      assert.ok(restored?.type === 'geo')
      assert.deepEqual(restored, before)
      assert.deepEqual(restored.props.richText, toRichText('RSS 获取'))
      const savedShape = saved.store[id]
      assert.equal(savedShape.typeName, 'shape')
      assert.ok('x' in savedShape)
      assert.equal(savedShape.x, 0)
      break
    }
    case 'scope': {
      putGeo(store, createShapeId('scope-rss'), '正文清洗')
      const snapshot = store.getStoreSnapshot()
      assert.ok(Object.values(snapshot.store).some((record) => record.typeName === 'shape'))
      assert.ok(
        Object.values(snapshot.store).every((record) =>
          store.scopedTypes.document.has(record.typeName),
        ),
      )
      assert.equal(
        Object.values(snapshot.store).some((record) => record.typeName === 'instance'),
        false,
      )
      const full = getSnapshot(store)
      assert.deepEqual(full.document, snapshot)
      assert.ok(full.session)
      assert.deepEqual(Object.keys(full).sort(), ['document', 'session'])
      break
    }
    default:
      throw new Error(`Unknown SDK scenario: ${workerData.scenario}`)
  }
} finally {
  store.dispose()
}
assert.ok(parentPort)
parentPort.postMessage({ scenario: workerData.scenario, passed: true })
