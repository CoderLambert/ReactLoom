import {
  clone,
  ensure,
  finite,
  parseDefinition,
  type Release,
  type Stage,
  text,
} from './approval-model.ts'

export type Values = Record<string, string | number>
export type Decision = {
  nodeId: string
  actor: string
  decision: 'approve' | 'reject'
  comment: string
  at: string
}
export type Request = {
  id: string
  release: Release
  values: Values
  submittedAt: string
  decisions: Decision[]
}
export type HistoryItem = { nodeId: string; message: string; at: string }
export type Inspection = {
  status: 'pending' | 'approved' | 'rejected'
  current: Stage | null
  history: HistoryItem[]
}

export function validateValues(release: Release, input: Values): Values {
  const values: Values = {}
  ensure(
    Object.keys(input).every((key) => release.definition.fields.some((f) => f.id === key)),
    '包含未定义的表单字段',
  )
  for (const field of release.definition.fields) {
    const value = input[field.id]
    if (value === undefined || value === '') {
      ensure(!field.required, `${field.label}为必填项`)
      continue
    }
    if (field.type === 'number') values[field.id] = finite(value, 0)
    else {
      const result = text(value, 2000, !field.required).trim()
      ensure(!field.required || result.length > 0, `${field.label}为必填项`)
      ensure(
        field.type !== 'select' || field.options.includes(result),
        `${field.label}不在可选范围内`,
      )
      values[field.id] = result
    }
  }
  return values
}
export function inspectRequest(request: Request): Inspection {
  const { definition } = request.release
  const start = definition.nodes.find((n) => n.data.kind === 'start')
  ensure(start, '缺少开始节点')
  let node: Stage = start
  const history: HistoryItem[] = [
    { nodeId: node.id, message: '申请已提交', at: request.submittedAt },
  ]
  let index = 0
  let at = request.submittedAt
  for (let step = 0; step <= definition.nodes.length; step++) {
    let port = 'next'
    if (node.data.kind === 'end') {
      ensure(index === request.decisions.length, '终态后包含多余审批记录')
      history.push({ nodeId: node.id, message: '审批完成', at })
      return { status: 'approved', current: null, history }
    }
    if (node.data.kind === 'condition') {
      const value = request.values[node.data.fieldId]
      ensure(typeof value === 'number' && Number.isFinite(value), '条件字段没有有效数值')
      port = value >= node.data.threshold ? 'yes' : 'no'
      history.push({
        nodeId: node.id,
        message: `${node.data.label}：${value} >= ${node.data.threshold}，${port === 'yes' ? '满足' : '不满足'}条件`,
        at,
      })
    }
    if (node.data.kind === 'approval') {
      const decision = request.decisions[index]
      if (!decision) return { status: 'pending', current: node, history }
      ensure(
        decision.nodeId === node.id && decision.actor === node.data.approver,
        '审批角色或当前节点不匹配',
      )
      index++
      at = decision.at
      history.push({
        nodeId: node.id,
        message: `${decision.actor} ${decision.decision === 'approve' ? '通过' : '驳回'}${decision.comment ? `：${decision.comment}` : ''}`,
        at,
      })
      if (decision.decision === 'reject') {
        ensure(index === request.decisions.length, '驳回后包含多余审批记录')
        return { status: 'rejected', current: null, history }
      }
    }
    const edge = definition.edges.find((e) => e.source === node.id && e.sourceHandle === port)
    ensure(edge, '流程断链')
    const next = definition.nodes.find((n) => n.id === edge.target)
    ensure(next, '目标节点不存在')
    node = next
  }
  throw new Error('流转超过安全步数')
}
export function submitRequest(
  release: Release,
  input: Values,
  id: string,
  at = new Date().toISOString(),
): Request {
  parseDefinition(JSON.stringify(release.definition))
  const result: Request = {
    id,
    release: clone(release),
    values: validateValues(release, input),
    submittedAt: at,
    decisions: [],
  }
  inspectRequest(result)
  return result
}
export function actOnRequest(
  request: Request,
  expectedNodeId: string,
  actor: string,
  decision: Decision['decision'],
  comment: string,
  at = new Date().toISOString(),
): Request {
  const current = inspectRequest(request).current
  ensure(current && current.id === expectedNodeId, '工单已流转，请刷新当前审批节点')
  ensure(current.data.approver === actor, '当前角色无权处理该节点')
  ensure(decision === 'approve' || decision === 'reject', '未知审批动作')
  const result = clone(request)
  result.decisions.push({
    nodeId: current.id,
    actor,
    decision,
    comment: text(comment, 500, true),
    at,
  })
  inspectRequest(result)
  return result
}
