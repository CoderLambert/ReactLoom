import assert from 'node:assert/strict'
import test from 'node:test'
import {
  beginWorkerObservation,
  failWorkerObservation,
  observeWorkerReply,
  serializeWorkerObservation,
} from '../src/lib/worker-observation.mjs'
import { parseWorkerReply } from '../src/lib/worker-protocol.mjs'

const begin = () =>
  beginWorkerObservation({
    runId: 'run-1',
    entryId: 'E05',
    demoId: 'basic',
    level: 'basic',
    sourceFingerprint: 'sha-example',
    startedAt: 1000,
  })
test('report is explicitly unverified and binds entry, demo, run and source', () => {
  const report = begin()
  assert.equal(report.assurance, 'unverified-browser-observation')
  assert.equal(report.sourceFingerprint, 'sha-example')
  assert.throws(() => serializeWorkerObservation(report), /terminal/)
  assert.throws(
    () =>
      beginWorkerObservation({
        runId: 'x',
        entryId: '../../',
        demoId: 'basic',
        level: 'basic',
        sourceFingerprint: '',
        startedAt: 1,
      }),
    /Invalid/,
  )
})
test('40 progress records cannot hide a terminal result, which is not SDK PASS', () => {
  let report = begin()
  for (let i = 0; i < 42; i++)
    report = observeWorkerReply(report, { type: 'progress', message: 'progress-' + i }, 1001 + i)
  assert.equal(report.log.length, 40)
  const terminal = parseWorkerReply(
    { type: 'result', message: 'done\n\u202eevil', runId: 'run-1' },
    'run-1',
  )
  report = observeWorkerReply(report, terminal, 1200)
  assert.equal(report.log.length, 40)
  assert.equal(report.log.at(-1), 'done  evil')
  assert.equal(report.outcome, 'worker-reported-result')
  assert.equal(report.endedAt, 1200)
  const blob = JSON.parse(serializeWorkerObservation(report))
  assert.equal(blob.elapsedMs, 200)
  assert.equal(blob.assurance, 'unverified-browser-observation')
  assert.equal(blob.sdkVerification, undefined)
  assert.deepEqual(observeWorkerReply(report, { type: 'error', message: 'late' }, 1300), report)
})
test('host exception and timeout are explicitly recorded and bounded', () => {
  const failed = failWorkerObservation(begin(), 'Worker crashed\nsecret', 1201)
  assert.equal(failed.outcome, 'host-error')
  assert.equal(failed.log.at(-1), 'Worker crashed secret')
  assert.equal(JSON.parse(serializeWorkerObservation(failed)).elapsedMs, 201)
  const timeout = failWorkerObservation(begin(), 'timeout', 900, 'timeout')
  assert.equal(timeout.outcome, 'timeout')
  assert.equal(timeout.endedAt, 1000)
  assert.throws(() => failWorkerObservation(begin(), 'bad', 1400, 'PASS'), /Invalid/)
})
test('wrong session and malformed messages are discarded before observation', () => {
  const r = begin()
  assert.equal(
    parseWorkerReply({ runId: 'another', type: 'result', message: 'not ours' }, r.runId),
    null,
  )
  assert.equal(
    parseWorkerReply({ runId: r.runId, type: 'result', message: { fake: 'ok' } }, r.runId),
    null,
  )
  assert.deepEqual(observeWorkerReply(r, null, 1300), r)
})
