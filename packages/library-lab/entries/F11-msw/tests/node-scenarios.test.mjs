import test from 'node:test'
import assert from 'node:assert/strict'
import {runScenario} from '../examples/node-runner.mjs'

// These tests import the real msw/node package and intercept actual fetch calls.
// They are intentionally not part of the no-dependency platform unit test suite.
test('MSW v3 GET handler intercepts a real fetch', async () => {
  const result = await runScenario('basic')
  assert.equal(result.status, 200)
  assert.equal(result.body.id, '42')
})

test('MSW v3 POST handler returns explicit field errors', async () => {
  const result = await runScenario('business')
  assert.equal(result.accepted, 200)
  assert.equal(result.rejected, 422)
  assert.equal(result.error.error.code, 'INVALID_CODE')
})

test('MSW handler override simulates a one-time 503 then recovery', async () => {
  const result = await runScenario('advanced')
  assert.deepEqual([result.first, result.second, result.attempts], [503, 200, 2])
})
