import { appendWorkerLog } from './worker-protocol.mjs'

// A clipboard-only browser observation. A Worker can claim arbitrary results;
// this record must never be interpreted as a verified SDK test or CI PASS.
const TERMINAL = new Set([
  'worker-reported-result',
  'worker-reported-error',
  'host-error',
  'timeout',
])
const ID = /^[A-F][0-9]{2}$/u
export function beginWorkerObservation({
  runId,
  entryId,
  demoId,
  level,
  sourceFingerprint,
  startedAt,
}) {
  if (
    typeof runId !== 'string' ||
    !runId ||
    runId.length > 100 ||
    !ID.test(entryId) ||
    !['basic', 'business', 'advanced'].includes(demoId) ||
    demoId !== level ||
    typeof sourceFingerprint !== 'string' ||
    !Number.isSafeInteger(startedAt) ||
    startedAt < 0
  ) {
    throw new Error('Invalid Worker observation identity')
  }
  return {
    schema: 'library-lab/worker-observation/v1',
    assurance: 'unverified-browser-observation',
    runId,
    entryId,
    demoId,
    level,
    sourceFingerprint,
    startedAt,
    endedAt: null,
    outcome: 'running',
    log: [],
  }
}

function elapsedEnd(report, endedAt) {
  return Number.isSafeInteger(endedAt) && endedAt >= report.startedAt ? endedAt : report.startedAt
}

export function observeWorkerReply(report, reply, at) {
  if (report.outcome !== 'running') return report
  if (
    !reply ||
    !['progress', 'result', 'error'].includes(reply.type) ||
    typeof reply.message !== 'string'
  )
    return report
  const outcome =
    reply.type === 'result'
      ? 'worker-reported-result'
      : reply.type === 'error'
        ? 'worker-reported-error'
        : 'running'
  const terminal = TERMINAL.has(outcome)
  return {
    ...report,
    log: appendWorkerLog(report.log, reply),
    outcome,
    endedAt: terminal ? elapsedEnd(report, at) : null,
  }
}

export function failWorkerObservation(report, message, at, kind = 'host-error') {
  if (report.outcome !== 'running') return report
  if (kind !== 'host-error' && kind !== 'timeout') throw new Error('Invalid Worker host failure')
  const safeMessage = String(message)
    .replace(/\p{Cc}/gu, (character) => (character.charCodeAt(0) < 0x80 ? ' ' : character))
    .replace(/[\u202a-\u202e\u2066-\u2069]/gu, ' ')
    .slice(0, 4096)
  return {
    ...report,
    log: appendWorkerLog(report.log, { type: 'error', message: safeMessage }),
    outcome: kind,
    endedAt: elapsedEnd(report, at),
  }
}

export function serializeWorkerObservation(report) {
  if (
    !report ||
    report.schema !== 'library-lab/worker-observation/v1' ||
    report.outcome === 'running' ||
    !TERMINAL.has(report.outcome)
  ) {
    throw new Error('Only terminal Worker observations may be copied')
  }
  return JSON.stringify({ ...report, elapsedMs: report.endedAt - report.startedAt }, null, 2)
}
