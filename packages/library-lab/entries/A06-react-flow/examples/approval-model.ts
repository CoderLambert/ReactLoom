import { validateConnection } from './graph-rules.ts'

export type Level = 'basic' | 'business' | 'advanced'
export type Field = {
  id: string
  label: string
  type: 'text' | 'number' | 'select'
  required: boolean
  options: string[]
}
export type StageData = {
  kind: 'start' | 'approval' | 'condition' | 'end'
  label: string
  approver: string
  fieldId: string
  threshold: number
}
export type Stage = {
  id: string
  type: 'approval-stage'
  position: { x: number; y: number }
  data: StageData
}
export type Link = {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
}
export type Definition = {
  schemaVersion: 1
  name: string
  fields: Field[]
  nodes: Stage[]
  edges: Link[]
}
export type Release = { version: number; publishedAt: string; definition: Definition }
export const LIMITS = { fields: 12, nodes: 24, edges: 48, json: 200_000, requests: 50 }
export const clone = <T>(value: T): T => structuredClone(value)
export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
export function object(value: unknown, keys: string[]): Record<string, unknown> {
  ensure(value !== null && typeof value === 'object' && !Array.isArray(value), '需要 JSON 对象')
  const result = value as Record<string, unknown>
  ensure(
    Object.keys(result).every((key) => keys.includes(key)) &&
      keys.every((key) => Object.hasOwn(result, key)),
    '配置字段缺失或包含未知字段',
  )
  return result
}
export function text(value: unknown, max = 80, allowEmpty = false): string {
  ensure(
    typeof value === 'string' && value.length <= max && (allowEmpty || value.trim().length > 0),
    '文本为空或超过长度限制',
  )
  return value
}
function id(value: unknown): string {
  const result = text(value)
  ensure(
    /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/u.test(result),
    '标识必须以字母开头，仅包含字母、数字、下划线或横线',
  )
  return result
}
export function finite(value: unknown, min = -1e12, max = 1e12): number {
  ensure(
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max,
    '数值超出范围或不是有限数值',
  )
  return value
}
export function list(value: unknown, max: number): unknown[] {
  ensure(Array.isArray(value) && value.length <= max, '集合超过数量限制')
  return value
}
export function readDefinition(input: unknown): Definition {
  const d = object(input, ['schemaVersion', 'name', 'fields', 'nodes', 'edges'])
  ensure(d.schemaVersion === 1, '不支持的 schemaVersion')
  const fields = list(d.fields, LIMITS.fields).map<Field>((value) => {
    const f = object(value, ['id', 'label', 'type', 'required', 'options'])
    ensure(f.type === 'text' || f.type === 'number' || f.type === 'select', '不支持的字段类型')
    ensure(typeof f.required === 'boolean', 'required 必须是布尔值')
    return {
      id: id(f.id),
      label: text(f.label),
      type: f.type,
      required: f.required,
      options: list(f.options, 12).map((v) => text(v).trim()),
    }
  })
  const nodes = list(d.nodes, LIMITS.nodes).map<Stage>((value) => {
    const n = object(value, ['id', 'type', 'position', 'data'])
    ensure(n.type === 'approval-stage', '不支持的节点类型')
    const p = object(n.position, ['x', 'y'])
    const data = object(n.data, ['kind', 'label', 'approver', 'fieldId', 'threshold'])
    ensure(
      data.kind === 'start' ||
        data.kind === 'approval' ||
        data.kind === 'condition' ||
        data.kind === 'end',
      '不支持的业务节点',
    )
    return {
      id: id(n.id),
      type: 'approval-stage' as const,
      position: { x: finite(p.x, -100000, 100000), y: finite(p.y, -100000, 100000) },
      data: {
        kind: data.kind,
        label: text(data.label),
        approver: text(data.approver, 80, true),
        fieldId: text(data.fieldId, 80, true),
        threshold: finite(data.threshold, 0),
      },
    }
  })
  const edges = list(d.edges, LIMITS.edges).map((value) => {
    const e = object(value, ['id', 'source', 'target', 'sourceHandle', 'targetHandle'])
    return {
      id: id(e.id),
      source: id(e.source),
      target: id(e.target),
      sourceHandle: text(e.sourceHandle),
      targetHandle: text(e.targetHandle),
    }
  })
  return { schemaVersion: 1, name: text(d.name), fields, nodes, edges }
}

export function ports(node: Stage): string[] {
  return node.data.kind === 'end' ? [] : node.data.kind === 'condition' ? ['yes', 'no'] : ['next']
}
export function connectionError(
  d: Definition,
  source: string | null,
  target: string | null,
  port: string | null,
): string {
  const result = validateConnection(d.nodes, d.edges, source, target)
  if (!result.valid) return `连接无效：${result.reason}`
  const from = d.nodes.find((n) => n.id === source)
  const to = d.nodes.find((n) => n.id === target)
  if (!from || !to) return '连接端点不存在'
  if (!port || !ports(from).includes(port)) return '源节点没有这个出口'
  if (to.data.kind === 'start') return '开始节点不能接收入边'
  if (d.edges.some((e) => e.source === source && e.sourceHandle === port))
    return '每个出口只允许一条连线，请先删除旧连线'
  return ''
}
export function validateDefinition(d: Definition): string[] {
  const errors: string[] = []
  try {
    readDefinition(d)
  } catch (error) {
    return [String(error)]
  }
  if (!d.fields.length) errors.push('至少配置一个表单字段')
  for (const [label, items] of [
    ['字段', d.fields],
    ['节点', d.nodes],
    ['连线', d.edges],
  ] as const) {
    if (new Set(items.map((item) => item.id)).size !== items.length) errors.push(`${label}标识重复`)
  }
  for (const field of d.fields) {
    if (
      field.type === 'select' &&
      (!field.options.length || new Set(field.options).size !== field.options.length)
    )
      errors.push(`${field.label}：选项不能为空或重复`)
  }
  const starts = d.nodes.filter((n) => n.data.kind === 'start')
  if (starts.length !== 1 || d.nodes.filter((n) => n.data.kind === 'end').length !== 1)
    errors.push('需要唯一的开始和结束节点')
  const accepted: Link[] = []
  for (const edge of d.edges) {
    const message = connectionError(
      { ...d, edges: accepted },
      edge.source,
      edge.target,
      edge.sourceHandle,
    )
    if (message || edge.targetHandle !== 'in')
      errors.push(`${edge.id}：${message || '目标端口无效'}`)
    accepted.push(edge)
  }
  for (const node of d.nodes) {
    for (const port of ports(node)) {
      if (d.edges.filter((e) => e.source === node.id && e.sourceHandle === port).length !== 1)
        errors.push(`${node.data.label}：出口 ${port} 必须且只能连接一次`)
    }
    if (node.data.kind === 'approval' && !node.data.approver.trim())
      errors.push(`${node.data.label}：请配置审批人`)
    if (
      node.data.kind === 'condition' &&
      !d.fields.some((f) => f.id === node.data.fieldId && f.type === 'number' && f.required)
    )
      errors.push(`${node.data.label}：条件必须引用必填数值字段`)
  }
  const visited = new Set<string>()
  const queue = starts.map((n) => n.id)
  while (queue.length) {
    const next = queue.pop()
    if (!next) continue
    if (visited.has(next)) continue
    visited.add(next)
    queue.push(...d.edges.filter((e) => e.source === next).map((e) => e.target))
  }
  for (const node of d.nodes)
    if (!visited.has(node.id)) errors.push(`${node.data.label}：从开始节点不可达`)
  return [...new Set(errors)]
}
export function parseDefinition(json: string): Definition {
  ensure(json.length <= LIMITS.json, 'JSON 超过 200 KB 限制')
  const result = readDefinition(JSON.parse(json))
  const errors = validateDefinition(result)
  ensure(!errors.length, errors.join('；'))
  return result
}
export function publishDefinition(
  draft: Definition,
  previous: Release | null,
  at = new Date().toISOString(),
): Release {
  const definition = parseDefinition(JSON.stringify(draft))
  return { version: (previous?.version ?? 0) + 1, publishedAt: at, definition }
}
export function createDefinition(level: Level): Definition {
  const node = (
    id: string,
    kind: StageData['kind'],
    label: string,
    x: number,
    y: number,
    extra: Partial<StageData> = {},
  ): Stage => ({
    id,
    type: 'approval-stage',
    position: { x, y },
    data: { kind, label, approver: '', fieldId: '', threshold: 5000, ...extra },
  })
  const edge = (source: string, target: string, port = 'next'): Link => ({
    id: `e-${source}-${port}`,
    source,
    target,
    sourceHandle: port,
    targetHandle: 'in',
  })
  const basic = level === 'basic'
  return {
    schemaVersion: 1,
    name: basic ? '通用申请审批' : '费用报销审批',
    fields: [
      { id: 'applicant', label: '申请人', type: 'text', required: true, options: [] },
      { id: 'amount', label: '报销金额', type: 'number', required: true, options: [] },
      {
        id: 'category',
        label: '费用类型',
        type: 'select',
        required: true,
        options: ['差旅', '采购', '办公'],
      },
      { id: 'reason', label: '申请说明', type: 'text', required: true, options: [] },
    ],
    nodes: [
      node('start', 'start', '提交申请', 0, 140),
      node('manager', 'approval', '经理审核', 240, 140, { approver: '直属经理' }),
      ...(!basic
        ? [
            node('condition', 'condition', '大额费用判断', 480, 140, { fieldId: 'amount' }),
            node('finance', 'approval', '财务复核', 720, 0, { approver: '财务' }),
          ]
        : []),
      node('end', 'end', '审批完成', basic ? 480 : 960, 140),
    ],
    edges: basic
      ? [edge('start', 'manager'), edge('manager', 'end')]
      : [
          edge('start', 'manager'),
          edge('manager', 'condition'),
          edge('condition', 'finance', 'yes'),
          edge('condition', 'end', 'no'),
          edge('finance', 'end'),
        ],
  }
}
