import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import * as contract from '../scripts/verification-contract.mjs'

const digest = (value) => createHash('sha256').update(value).digest('hex')
const fingerprint = 'f'.repeat(64)
async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'lab-evidence-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const evidence = 'docs/library-lab/evidence/runs/D03-sdk.json'
  const log = 'docs/library-lab/evidence/runs/D03-sdk.log'
  await mkdir(path.dirname(path.join(root, evidence)), { recursive: true })
  const command = 'node scripts/sdk-runner.mjs --entry=D03'
  const bytes = Buffer.from('$ ' + command + '\n# tests 1\n# pass 1\n# fail 0\n')
  await writeFile(path.join(root, log), bytes)
  const receipt = {
    schemaVersion: 1,
    kind: 'sdk',
    entryId: 'D03',
    sourceFingerprint: fingerprint,
    command,
    status: 'PASS',
    exitCode: 0,
    head: 'a'.repeat(40),
    node: '22.18.0',
    startedAt: '2026-10-28T00:00:00.000Z',
    finishedAt: '2026-10-28T00:00:01.000Z',
    log: { path: log, sha256: digest(bytes), bytes: bytes.length },
  }
  const text = JSON.stringify(receipt)
  await writeFile(path.join(root, evidence), text)
  const raw = {
    sdk: {
      status: 'PASS',
      sourceFingerprint: fingerprint,
      command,
      evidence,
      evidenceSha256: digest(text),
    },
  }
  return { root, raw, receipt, evidence, log }
}
test('matching strings alone never establish executed PASS or FAIL', () => {
  for (const status of ['PASS', 'FAIL']) {
    const state = contract.verifiedState(
      {
        sdk: {
          status,
          sourceFingerprint: fingerprint,
          command: 'not run',
          evidence: 'does-not-exist',
        },
      },
      fingerprint,
    )
    assert.equal(state.sdk.status, 'NOT_RUN')
  }
})
test('a real bounded receipt and log have a positive acceptance path', async (t) => {
  assert.equal(typeof contract.verifiedStateFromFiles, 'function')
  const { root, raw } = await fixture(t)
  const state = await contract.verifiedStateFromFiles(raw, fingerprint, {
    repoRoot: root,
    entryId: 'D03',
  })
  assert.equal(state.sdk.status, 'PASS')
})
test('missing, changed or unrelated receipts cannot become PASS', async (t) => {
  assert.equal(typeof contract.verifiedStateFromFiles, 'function')
  const f = await fixture(t)
  for (const changes of [
    { evidence: 'docs/library-lab/evidence/runs/missing.json' },
    { evidence: '../../outside.json' },
    { command: 'echo pass' },
    { evidenceSha256: '0'.repeat(64) },
  ]) {
    const state = await contract.verifiedStateFromFiles(
      { sdk: { ...f.raw.sdk, ...changes } },
      fingerprint,
      { repoRoot: f.root, entryId: 'D03' },
    )
    assert.equal(state.sdk.status, 'NOT_RUN')
  }
  const wrongEntry = await contract.verifiedStateFromFiles(f.raw, fingerprint, {
    repoRoot: f.root,
    entryId: 'D04',
  })
  assert.equal(wrongEntry.sdk.status, 'NOT_RUN')
  await writeFile(path.join(f.root, f.log), 'changed output')
  assert.equal(
    (
      await contract.verifiedStateFromFiles(f.raw, fingerprint, {
        repoRoot: f.root,
        entryId: 'D03',
      })
    ).sdk.status,
    'NOT_RUN',
  )
})
test('wrong exit status and symlinked evidence are rejected', async (t) => {
  assert.equal(typeof contract.verifiedStateFromFiles, 'function')
  const f = await fixture(t)
  const text = JSON.stringify({ ...f.receipt, exitCode: 1 })
  await writeFile(path.join(f.root, f.evidence), text)
  const raw = { sdk: { ...f.raw.sdk, evidenceSha256: digest(text) } }
  assert.equal(
    (await contract.verifiedStateFromFiles(raw, fingerprint, { repoRoot: f.root, entryId: 'D03' }))
      .sdk.status,
    'NOT_RUN',
  )
  await rm(path.join(f.root, f.evidence))
  await symlink(path.join(f.root, f.log), path.join(f.root, f.evidence))
  assert.equal(
    (
      await contract.verifiedStateFromFiles(f.raw, fingerprint, {
        repoRoot: f.root,
        entryId: 'D03',
      })
    ).sdk.status,
    'NOT_RUN',
  )
})
