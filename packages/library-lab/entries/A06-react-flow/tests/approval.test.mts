import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createDefinition,
  parseDefinition,
  publishDefinition,
  validateDefinition,
} from '../examples/approval-model.ts'
import { actOnRequest, inspectRequest, submitRequest } from '../examples/approval-runtime.ts'
import { parseWorkspace, saveWorkspace } from '../examples/approval-storage.ts'

const values = { applicant: 'Ada', amount: 200, category: '差旅', reason: '客户拜访' }
const release = () => publishDefinition(createDefinition('business'), null, '2026-11-09T00:00:00Z')

test('publication rejects incomplete graphs, cycles and invalid numeric conditions', () => {
  const draft = createDefinition('business')
  assert.deepEqual(validateDefinition(draft), [])
  const broken = structuredClone(draft)
  broken.edges.pop()
  assert.ok(validateDefinition(broken).length)
  assert.throws(() => publishDefinition(broken, null))
  const condition = draft.nodes.find((n) => n.data.kind === 'condition')
  assert.ok(condition)
  condition.data.fieldId = 'applicant'
  assert.match(validateDefinition(draft).join(' '), /必填数值/)
  const cyclic = createDefinition('business')
  cyclic.edges.push({
    id: 'cycle',
    source: 'finance',
    target: 'manager',
    sourceHandle: 'next',
    targetHandle: 'in',
  })
  assert.ok(validateDefinition(cyclic).some((e) => /环|出口/.test(e)))
})

test('unreachable nodes and duplicate ports cannot be published', () => {
  const draft = createDefinition('business')
  draft.nodes.push({
    id: 'orphan',
    type: 'approval-stage',
    position: { x: 0, y: 0 },
    data: { kind: 'approval', label: '孤立节点', approver: '负责人', fieldId: '', threshold: 5000 },
  })
  assert.match(validateDefinition(draft).join(' '), /不可达/)
  const duplicate = createDefinition('business')
  duplicate.edges.push({ ...duplicate.edges[0], id: 'duplicate' })
  assert.match(validateDefinition(duplicate).join(' '), /出口|重复/)
})

test('small requests finish after manager; large requests wait for finance', () => {
  const small = submitRequest(release(), values, 'small')
  assert.equal(inspectRequest(small).current?.data.approver, '直属经理')
  const done = actOnRequest(small, 'manager', '直属经理', 'approve', '同意')
  assert.equal(inspectRequest(done).status, 'approved')
  assert.ok(inspectRequest(done).history.some((item) => item.message.includes('不满足')))
  const large = submitRequest(release(), { ...values, amount: 5000 }, 'large')
  const waiting = actOnRequest(large, 'manager', '直属经理', 'approve', '')
  assert.equal(inspectRequest(waiting).current?.id, 'finance')
  assert.equal(
    inspectRequest(actOnRequest(waiting, 'finance', '财务', 'approve', '')).status,
    'approved',
  )
})

test('reject ends request; wrong role, stale node and terminal actions are rejected', () => {
  const request = submitRequest(release(), values, 'reject')
  assert.throws(() => actOnRequest(request, 'manager', '财务', 'approve', ''))
  const rejected = actOnRequest(request, 'manager', '直属经理', 'reject', '发票不全')
  assert.equal(inspectRequest(rejected).status, 'rejected')
  assert.throws(() => actOnRequest(rejected, 'manager', '直属经理', 'approve', ''))
  const large = actOnRequest(
    submitRequest(release(), { ...values, amount: 9000 }, 'large'),
    'manager',
    '直属经理',
    'approve',
    '',
  )
  assert.throws(() => actOnRequest(large, 'manager', '直属经理', 'approve', '重复点击'))
})

test('publication and submission freeze independent definitions and validated values', () => {
  const draft = createDefinition('business')
  const published = publishDefinition(draft, null)
  const input = { ...values }
  const instance = submitRequest(published, input, 'snapshot')
  const draftManager = draft.nodes.find((n) => n.id === 'manager')
  const publishedManager = published.definition.nodes.find((n) => n.id === 'manager')
  assert.ok(draftManager && publishedManager)
  draftManager.data.approver = '另一经理'
  publishedManager.data.approver = '新经理'
  input.amount = 99999
  assert.equal(instance.values.amount, 200)
  assert.equal(inspectRequest(instance).current?.data.approver, '直属经理')
  assert.equal(publishDefinition(draft, published).version, 2)
})

test('required fields, select choices, unknown fields and finite numeric bounds are enforced', () => {
  for (const input of [
    { ...values, applicant: '' },
    { ...values, amount: NaN },
    { ...values, amount: Infinity },
    { ...values, amount: -1 },
    { ...values, category: '伪造' },
    { ...values, surprise: 'x' },
  ]) {
    assert.throws(() => submitRequest(release(), input, 'invalid'))
  }
})

test('bounded JSON import rejects corrupt shape, unknown executable fields and broken topology', () => {
  const draft = createDefinition('business')
  assert.deepEqual(parseDefinition(JSON.stringify(draft)), draft)
  for (const input of [
    '{',
    ' '.repeat(200001),
    JSON.stringify({ ...draft, script: 'alert(1)' }),
    JSON.stringify({ ...draft, edges: [] }),
    JSON.stringify({ ...draft, nodes: [{ id: '__proto__' }] }),
  ]) {
    assert.throws(() => parseDefinition(input))
  }
})

test('workspace reload preserves release and requests, rejects corruption, surfaces quota failure', () => {
  const published = release()
  const request = submitRequest(published, values, 'saved')
  const workspace = {
    schemaVersion: 1 as const,
    draft: createDefinition('business'),
    release: published,
    requests: [request],
  }
  assert.deepEqual(parseWorkspace(JSON.stringify(workspace)), workspace)
  const incomplete = structuredClone(workspace)
  incomplete.draft.edges = []
  assert.deepEqual(parseWorkspace(JSON.stringify(incomplete)).draft.edges, [])
  const corrupt = structuredClone(workspace)
  corrupt.requests[0].decisions.push({
    nodeId: 'finance',
    actor: '财务',
    decision: 'approve',
    comment: '',
    at: '2026-11-09T00:00:00Z',
  })
  assert.throws(() => parseWorkspace(JSON.stringify(corrupt)))
  assert.throws(
    () =>
      saveWorkspace(
        {
          setItem() {
            throw new Error('quota')
          },
        },
        'test',
        workspace,
      ),
    /quota/,
  )
})

test('stale browser tabs cannot overwrite a newer saved request', () => {
  const published = release()
  const old = {
    schemaVersion: 1 as const,
    draft: createDefinition('business'),
    release: published,
    requests: [],
  }
  let stored = JSON.stringify(old)
  const storage = {
    getItem: () => stored,
    setItem: (_key: string, value: string) => {
      stored = value
    },
  }
  const baseline = stored
  saveWorkspace(
    storage,
    'test',
    { ...old, requests: [submitRequest(published, values, 'new')] },
    baseline,
  )
  assert.throws(() => saveWorkspace(storage, 'test', old, baseline), /其他页面/)
  assert.equal(parseWorkspace(stored).requests.length, 1)
})

test('import normalizes select options and rejects duplicates after normalization', () => {
  const draft = createDefinition('business')
  const category = draft.fields.find((f) => f.id === 'category')
  assert.ok(category)
  category.options = [' 差旅 ']
  const normalized = parseDefinition(JSON.stringify(draft))
  const normalizedCategory = normalized.fields.find((f) => f.id === 'category')
  assert.ok(normalizedCategory)
  assert.equal(normalizedCategory.options[0], '差旅')
  assert.equal(
    submitRequest(publishDefinition(normalized, null), values, 'trimmed').values.category,
    '差旅',
  )
  category.options = [' 差旅 ', '差旅']
  assert.throws(() => parseDefinition(JSON.stringify(draft)), /重复/)
})
