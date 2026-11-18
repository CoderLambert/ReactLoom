import {
  applyNodeChanges,
  Background,
  type Connection,
  Controls,
  type Edge,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from '@xyflow/react'
import { useState } from 'react'
import {
  connectionError,
  type Definition,
  type Field,
  LIMITS,
  ports,
  type Stage,
  type StageData,
} from './approval-model.ts'
import '@xyflow/react/dist/style.css'

type FlowStage = Node<StageData, 'approval-stage'>
const names = { start: '开始', approval: '人工审批', condition: '条件分支', end: '结束' }
function StageNode({ data, isConnectable }: NodeProps<FlowStage>) {
  return (
    <div className={`lc-stage lc-stage-${data.kind}`}>
      {data.kind !== 'start' && (
        <Handle id="in" type="target" position={Position.Left} isConnectable={isConnectable} />
      )}
      <small>{names[data.kind]}</small>
      <strong>{data.label}</strong>
      <span>
        {data.kind === 'approval'
          ? data.approver || '待配置审批人'
          : data.kind === 'condition'
            ? `${data.fieldId || '选择字段'} ≥ ${data.threshold}`
            : data.kind === 'start'
              ? '动态表单提交'
              : '工单完成'}
      </span>
      {data.kind !== 'end' &&
        (data.kind === 'condition' ? (
          <>
            <Handle
              id="yes"
              type="source"
              position={Position.Right}
              style={{ top: '32%' }}
              isConnectable={isConnectable}
            />
            <Handle
              id="no"
              type="source"
              position={Position.Right}
              style={{ top: '75%' }}
              isConnectable={isConnectable}
            />
            <i className="lc-port-yes">满足</i>
            <i className="lc-port-no">不满足</i>
          </>
        ) : (
          <Handle id="next" type="source" position={Position.Right} isConnectable={isConnectable} />
        ))}
    </div>
  )
}
const nodeTypes = { 'approval-stage': StageNode }
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

export default function ApprovalDesigner({
  draft,
  onChange,
  onError,
}: {
  draft: Definition
  onChange: (draft: Definition) => void
  onError: (message: string) => void
}) {
  const [selected, setSelected] = useState('manager')
  const [measurements, setMeasurements] = useState<
    Record<string, { width?: number; height?: number }>
  >({})
  const [from, setFrom] = useState('manager')
  const [to, setTo] = useState('end')
  const [port, setPort] = useState('next')
  const current = draft.nodes.find((n) => n.id === selected)
  const source = draft.nodes.find((n) => n.id === from) ?? draft.nodes[0]
  const target = draft.nodes.find((n) => n.id === to) ?? draft.nodes[0]
  const sourcePort = source && ports(source).includes(port) ? port : source ? ports(source)[0] : ''
  const nodes: FlowStage[] = draft.nodes.map((n) => ({
    ...n,
    measured: measurements[n.id],
    selected: n.id === selected,
    deletable: n.data.kind !== 'start' && n.data.kind !== 'end',
  }))
  const edges: Edge[] = draft.edges.map((e) => ({
    ...e,
    label: e.sourceHandle === 'yes' ? '满足' : e.sourceHandle === 'no' ? '不满足' : undefined,
    type: 'smoothstep',
  }))
  function updateField(index: number, change: Partial<Field>) {
    onChange({
      ...draft,
      fields: draft.fields.map((field, i) => (i === index ? { ...field, ...change } : field)),
    })
  }
  function updateNode(change: Partial<StageData>) {
    onChange({
      ...draft,
      nodes: draft.nodes.map((node) =>
        node.id === selected ? { ...node, data: { ...node.data, ...change } } : node,
      ),
    })
  }
  function connect(connection: Connection) {
    const error =
      connection.targetHandle !== 'in'
        ? '目标端口无效'
        : connectionError(draft, connection.source, connection.target, connection.sourceHandle)
    if (error) return onError(error)
    if (draft.edges.length >= LIMITS.edges) return onError('最多 48 条连线')
    onChange({
      ...draft,
      edges: [
        ...draft.edges,
        {
          id: newId('edge'),
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle ?? 'next',
          targetHandle: 'in',
        },
      ],
    })
    onError('')
  }
  function addNode(kind: 'approval' | 'condition') {
    if (draft.nodes.length >= LIMITS.nodes) return onError('最多 24 个节点')
    const id = newId('node')
    const added: Stage = {
      id,
      type: 'approval-stage',
      position: { x: 240, y: 330 + (draft.nodes.length % 3) * 100 },
      data: {
        kind,
        label: kind === 'approval' ? '新增审批' : '新增条件',
        approver: '',
        fieldId: draft.fields.find((f) => f.type === 'number' && f.required)?.id ?? '',
        threshold: 5000,
      },
    }
    onChange({ ...draft, nodes: [...draft.nodes, added] })
    setSelected(id)
  }
  return (
    <div className="lc-designer">
      <section className="lc-panel" aria-label="表单配置">
        <h3>01 / 表单配置</h3>
        <label>
          流程名称
          <input
            value={draft.name}
            maxLength={80}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
          />
        </label>
        <p className="lc-muted">字段标识保持不变。数值范围 0～10¹²。</p>
        {draft.fields.map((field, index) => (
          <fieldset key={field.id} className="lc-field-card">
            <legend>字段 {index + 1}</legend>
            <label>
              名称
              <input
                aria-label={`字段名称 ${index + 1}`}
                value={field.label}
                maxLength={80}
                onChange={(e) => updateField(index, { label: e.target.value })}
              />
            </label>
            <label>
              类型
              <select
                aria-label={`字段类型 ${index + 1}`}
                value={field.type}
                onChange={(e) => updateField(index, { type: e.target.value as Field['type'] })}
              >
                <option value="text">文本</option>
                <option value="number">数值</option>
                <option value="select">单选</option>
              </select>
            </label>
            <label className="lc-check">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(index, { required: e.target.checked })}
              />
              必填
            </label>
            {field.type === 'select' && (
              <label>
                选项（用逗号分隔）
                <input
                  aria-label={`字段选项 ${index + 1}`}
                  value={field.options.join(',')}
                  maxLength={900}
                  onChange={(e) =>
                    updateField(index, {
                      options: e.target.value.split(/[,，]/u).map((v) => v.trim()),
                    })
                  }
                />
              </label>
            )}
            <button
              type="button"
              className="lc-danger"
              aria-label={`删除字段 ${index + 1}`}
              onClick={() =>
                onChange({ ...draft, fields: draft.fields.filter((f) => f.id !== field.id) })
              }
            >
              删除字段
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          disabled={draft.fields.length >= LIMITS.fields}
          onClick={() =>
            onChange({
              ...draft,
              fields: [
                ...draft.fields,
                {
                  id: newId('field'),
                  label: '新增字段',
                  type: 'text',
                  required: false,
                  options: [],
                },
              ],
            })
          }
        >
          ＋ 添加字段
        </button>
      </section>
      <section className="lc-canvas-section" aria-label="流程画布">
        <div className="lc-row">
          <h3>02 / 流程编排</h3>
          <button type="button" onClick={() => addNode('approval')}>
            ＋ 审批节点
          </button>
          <button type="button" onClick={() => addNode('condition')}>
            ＋ 条件节点
          </button>
        </div>
        <p className="lc-muted">点击节点编辑属性。每个出口只接一条线；删除旧连线后可重新连接。</p>
        <div className="lc-canvas">
          <ReactFlow<FlowStage>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            deleteKeyCode={null}
            onNodeClick={(_, node) => setSelected(node.id)}
            onNodesChange={(changes) => {
              const result = applyNodeChanges(changes, nodes)
              if (changes.some((change) => change.type === 'dimensions'))
                setMeasurements(Object.fromEntries(result.map((n) => [n.id, n.measured ?? {}])))
              if (
                changes.some((change) => change.type === 'position' || change.type === 'remove')
              ) {
                const ids = new Set(result.map((n) => n.id))
                onChange({
                  ...draft,
                  nodes: result.map((n) => ({
                    id: n.id,
                    type: 'approval-stage',
                    position: n.position,
                    data: n.data,
                  })),
                  edges: draft.edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
                })
              }
            }}
            isValidConnection={(c) =>
              c.targetHandle === 'in' &&
              !connectionError(draft, c.source, c.target, c.sourceHandle ?? null)
            }
            onConnect={connect}
          >
            <Background gap={20} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable ariaLabel="审批流程缩略图" />
          </ReactFlow>
        </div>
        <details open className="lc-panel">
          <summary>键盘编辑与连接清单</summary>
          <div className="lc-node-picker">
            {draft.nodes.map((n) => (
              <button
                type="button"
                key={n.id}
                aria-label={`编辑节点 ${n.data.label}`}
                aria-pressed={selected === n.id}
                onClick={() => setSelected(n.id)}
              >
                {n.data.label}
              </button>
            ))}
          </div>
          <div className="lc-row">
            <label>
              连线起点
              <select value={source?.id ?? ''} onChange={(e) => setFrom(e.target.value)}>
                {draft.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.data.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              出口
              <select value={sourcePort ?? ''} onChange={(e) => setPort(e.target.value)}>
                {source &&
                  ports(source).map((p) => (
                    <option key={p} value={p}>
                      {p === 'yes' ? '满足' : p === 'no' ? '不满足' : '下一步'}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              连线终点
              <select value={target?.id ?? ''} onChange={(e) => setTo(e.target.value)}>
                {draft.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.data.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                connect({
                  source: source?.id ?? '',
                  target: target?.id ?? '',
                  sourceHandle: sourcePort ?? null,
                  targetHandle: 'in',
                })
              }
            >
              添加连线
            </button>
          </div>
          <ul className="lc-edge-list">
            {draft.edges.map((edge) => (
              <li key={edge.id}>
                <span>
                  {draft.nodes.find((n) => n.id === edge.source)?.data.label} /{' '}
                  {edge.sourceHandle === 'yes'
                    ? '满足'
                    : edge.sourceHandle === 'no'
                      ? '不满足'
                      : '下一步'}{' '}
                  → {draft.nodes.find((n) => n.id === edge.target)?.data.label}
                </span>
                <button
                  type="button"
                  aria-label={`删除连线 ${edge.id}`}
                  onClick={() =>
                    onChange({ ...draft, edges: draft.edges.filter((e) => e.id !== edge.id) })
                  }
                >
                  删除连线
                </button>
              </li>
            ))}
          </ul>
        </details>
      </section>
      <section className="lc-panel" aria-label="节点属性">
        <h3>03 / 节点属性</h3>
        {current ? (
          <>
            <span className="lc-pill">{names[current.data.kind]}</span>
            <label>
              节点名称
              <input
                value={current.data.label}
                maxLength={80}
                onChange={(e) => updateNode({ label: e.target.value })}
              />
            </label>
            {current.data.kind === 'approval' && (
              <label>
                审批角色
                <input
                  value={current.data.approver}
                  maxLength={80}
                  placeholder="例如：直属经理"
                  onChange={(e) => updateNode({ approver: e.target.value })}
                />
              </label>
            )}
            {current.data.kind === 'condition' && (
              <>
                <label>
                  比较字段
                  <select
                    value={current.data.fieldId}
                    onChange={(e) => updateNode({ fieldId: e.target.value })}
                  >
                    <option value="">请选择必填数值字段</option>
                    {draft.fields
                      .filter((f) => f.type === 'number' && f.required)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  大于等于阈值
                  <input
                    type="number"
                    min={0}
                    max={1e12}
                    value={Number.isFinite(current.data.threshold) ? current.data.threshold : ''}
                    onChange={(e) =>
                      updateNode({
                        threshold: e.target.value === '' ? NaN : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <p className="lc-muted">满足走 yes，不满足走 no。两个出口都必须连接。</p>
              </>
            )}
            {current.data.kind === 'approval' && (
              <p className="lc-muted">通过进入下一步；驳回直接结束工单，并保留原因。</p>
            )}
            <button
              type="button"
              className="lc-danger"
              disabled={current.data.kind === 'start' || current.data.kind === 'end'}
              onClick={() => {
                onChange({
                  ...draft,
                  nodes: draft.nodes.filter((n) => n.id !== selected),
                  edges: draft.edges.filter((e) => e.source !== selected && e.target !== selected),
                })
                setSelected('start')
              }}
            >
              删除当前节点
            </button>
          </>
        ) : (
          <p>在画布或节点清单中选择节点。</p>
        )}
        <p className="lc-muted">开始和结束节点固定保留。新增节点后必须接入流程才能发布。</p>
      </section>
    </div>
  )
}
