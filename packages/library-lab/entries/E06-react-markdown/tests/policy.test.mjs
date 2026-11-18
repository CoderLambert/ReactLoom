import assert from 'node:assert/strict'
import test from 'node:test'
import { safeMarkdownURL } from '../examples/render-policy.mjs'

test('URL policy allows explicit HTTPS without credentials and limited anchors', () => {
  assert.equal(safeMarkdownURL('https://example.com/a'), 'https://example.com/a')
  assert.equal(safeMarkdownURL('#section-2'), '#section-2')
})
test('URL policy rejects protocol relative, credentials, controls and ambiguous backslashes', () => {
  for (const url of [
    '//example.com/a',
    'https://user:pw@example.com/',
    'javascript:alert(1)',
    'data:text/html,x',
    'https://example.com/\npath',
    'https:\\example.com/',
    '/local',
    'mailto:a@example.com',
    '#space here',
    '',
  ])
    assert.equal(safeMarkdownURL(url), '')
})
