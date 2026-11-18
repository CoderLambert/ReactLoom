import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { useCallback, useState } from 'react'
import '@xyflow/react/dist/style.css'
import './flow-primer.css'

type PrimerNode = Node<{ label: string; direction: 'source' | 'target' }, 'primer-step'>

function createNodes(): PrimerNode[] {
  return [
    {
      id: 'source',
      type: 'primer-step',
      position: { x: 0, y: 40 },
      data: { label: '订阅源', direction: 'source' },
      deletable: false,
    },
    {
      id: 'target',
      type: 'primer-step',
      position: { x: 280, y: 120 },
      data: { label: '整理标题', direction: 'target' },
      deletable: false,
    },
  ]
}

function createEdges(): Edge[] {
  return [
    {
      id: 'source-target',
      source: 'source',
      target: 'target',
      sourceHandle: 'out',
      targetHandle: 'in',
    },
  ]
}

function PrimerStep({ data, isConnectable }: NodeProps<PrimerNode>) {
  return (
    <div className="rf-primer-node">
      <small>{data.direction === 'source' ? 'SOURCE / 出口 out' : 'TARGET / 入口 in'}</small>
      <strong>{data.label}</strong>
      <Handle
        id={data.direction === 'source' ? 'out' : 'in'}
        type={data.direction === 'source' ? 'source' : 'target'}
        position={data.direction === 'source' ? Position.Right : Position.Left}
        isConnectable={isConnectable}
      />
    </div>
  )
}

const nodeTypes = { 'primer-step': PrimerStep }
const validConnection = (connection: Connection | Edge) =>
  connection.source === 'source' &&
  connection.target === 'target' &&
  connection.sourceHandle === 'out' &&
  connection.targetHandle === 'in'

/** A small controlled flow, independent from the approval workbench and its persistence. */
export default function FlowPrimer() {
  const [nodes, setNodes, onNodesChange] = useNodesState<PrimerNode>(createNodes())
  const [edges, setEdges, onEdgesChange] = useEdgesState(createEdges())
  const [reset, setReset] = useState(0)
  const connect = useCallback(
    (connection: Connection) => {
      if (validConnection(connection)) setEdges((current) => addEdge(connection, current))
    },
    [setEdges],
  )
  const source = nodes.find((node) => node.id === 'source')
  const snapshot = {
    nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
    edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({
      id,
      source,
      target,
      sourceHandle,
      targetHandle,
    })),
  }

  return (
    <section className="rf-primer" aria-label="React Flow 图编辑入门">
      <header>
        <p className="rf-primer-kicker">BASIC / 两节点图</p>
        <h2>先让 nodes 和 edges 跟着操作变化</h2>
        <p>
          拖动节点看坐标，再清空连线，从右侧 out 拖到左侧 in。画布和下方 JSON 读取同一份 React
          状态。
        </p>
      </header>
      <div className="rf-primer-actions">
        <button
          type="button"
          onClick={() =>
            setNodes((current) =>
              current.map((node) =>
                node.id === 'source'
                  ? { ...node, position: { ...node.position, x: node.position.x + 40 } }
                  : node,
              ),
            )
          }
        >
          源节点向右移动 40
        </button>
        <button type="button" onClick={() => setEdges([])}>
          清空入门连线
        </button>
        <button
          type="button"
          disabled={edges.length > 0}
          onClick={() =>
            connect({
              source: 'source',
              target: 'target',
              sourceHandle: 'out',
              targetHandle: 'in',
            })
          }
        >
          连接 source → target
        </button>
        <button
          type="button"
          onClick={() => {
            setNodes(createNodes())
            setEdges(createEdges())
            setReset((value) => value + 1)
          }}
        >
          重置入门图
        </button>
      </div>
      <div className="rf-primer-layout">
        <div className="rf-primer-canvas">
          <ReactFlow<PrimerNode>
            key={reset}
            id="a06-flow-primer"
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={connect}
            isValidConnection={validConnection}
            deleteKeyCode={null}
            fitView
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background gap={20} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className="rf-primer-inspector">
          <h3>当前图数据</h3>
          <label>
            源节点名称
            <input
              maxLength={24}
              value={source?.data.label ?? ''}
              onChange={(event) => {
                const label = event.target.value
                setNodes((current) =>
                  current.map((node) =>
                    node.id === 'source' ? { ...node, data: { ...node.data, label } } : node,
                  ),
                )
              }}
            />
          </label>
          <p data-testid="primer-source-position">
            source 画布坐标：x={Math.round(source?.position.x ?? 0)} / y=
            {Math.round(source?.position.y ?? 0)}
          </p>
          <p data-testid="primer-edge-count">
            节点 {nodes.length} / 连线 {edges.length}
          </p>
          <p>缩放和平移改变视口；节点 position 是图坐标。删除入门边不会删除节点。</p>
        </aside>
      </div>
      <details>
        <summary>查看同一份 nodes / edges JSON</summary>
        <pre data-testid="primer-state-json">{JSON.stringify(snapshot, null, 2)}</pre>
      </details>
      <p className="rf-primer-note">
        这个小图只演示编辑与连线，不执行数据处理，也不保存。下面保留完整的线性审批工作台；业务层再加入条件分支，进阶层处理发布和
        JSON 迁移。
      </p>
    </section>
  )
}
