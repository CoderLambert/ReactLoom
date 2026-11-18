import { useEffect, useMemo, useRef, useState } from 'react'
import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva'
import {
  canAddNode,
  clampNodePosition,
  MAX_NODES,
  measuredStageWidth,
  newNodePosition,
  stageScale,
} from './stage-policy'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
type SceneNode = { id: string; title: string; x: number; y: number; fill: string }
const INITIAL: SceneNode[] = [
  { id: 'collect', title: '采集 RSS', x: 28, y: 58, fill: '#cfe7d7' },
  { id: 'translate', title: '翻译', x: 220, y: 118, fill: '#e0e9fc' },
  { id: 'publish', title: '审核发布', x: 410, y: 45, fill: '#f5e6cf' },
]

function useStageWidth() {
  const host = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1)
  useEffect(() => {
    const element = host.current
    if (!element) return
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setWidth(measuredStageWidth(element.clientWidth)))
    })
    observer.observe(element)
    setWidth(measuredStageWidth(element.clientWidth))
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])
  return { host, width }
}

export default function ReactKonvaExample({ level }: { level: Level }) {
  const { host, width } = useStageWidth()
  const [nodes, setNodes] = useState<SceneNode[]>(INITIAL)
  const nextNodeId = useRef(0)
  const [selected, setSelected] = useState('collect')
  const [locked, setLocked] = useState(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Changing lesson intentionally resets the same local fixture.
  useEffect(() => {
    setNodes(INITIAL)
    setSelected('collect')
    setLocked(false)
  }, [level])
  const scale = stageScale(width)
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const update = (id: string, patch: Partial<SceneNode>) =>
    setNodes((old) => old.map((node) => (node.id === id ? { ...node, ...patch } : node)))
  const selectedNode = nodes.find((node) => node.id === selected)

  return (
    <section
      className="a12-workshop"
      aria-label="react-konva 实际渲染"
      data-testid="a12-workshop"
      data-level={level}
      data-width={width}
      data-scale={scale}
      data-selected={selected}
      data-count={nodes.length}
      data-locked={locked}
    >
      <h2>
        {level === 'basic'
          ? '声明式 Canvas 节点'
          : level === 'business'
            ? '拖拽提交世界坐标'
            : '增删、锁定拖拽与尺寸响应'}
      </h2>
      <p>真实 react-konva Stage/Layer/Rect/Text。节点数组是本地教学数据，不执行 RSS 或翻译服务。</p>
      <div
        ref={host}
        className="a12-stage-host"
        data-testid="a12-stage-host"
        role="img"
        aria-label="流程节点Canvas；下方提供等价选择、移动和数据表"
      >
        <Stage width={width} height={Math.ceil(260 * scale)} scaleX={scale} scaleY={scale}>
          <Layer listening={false}>
            <Rect x={0} y={0} width={620} height={260} fill="#f9fcf7" />
            {nodes.slice(0, -1).map((node, index) => {
              const next = nodeMap.get(nodes[index + 1].id)
              return next ? (
                <Line
                  key={`line-${node.id}`}
                  points={[node.x + 132, node.y + 22, next.x, next.y + 22]}
                  stroke="#8da997"
                  strokeWidth={2}
                  dash={[6, 3]}
                />
              ) : null
            })}
          </Layer>
          <Layer>
            {nodes.map((node) => (
              <Group
                key={node.id}
                id={node.id}
                x={node.x}
                y={node.y}
                draggable={level !== 'basic' && !locked}
                onClick={() => setSelected(node.id)}
                onTap={() => setSelected(node.id)}
                onDragMove={(event) =>
                  event.target.position(clampNodePosition(event.target.position()))
                }
                onDragEnd={(event) => {
                  const next = clampNodePosition(event.target.position())
                  event.target.position(next)
                  update(node.id, next)
                }}
              >
                <Rect
                  width={132}
                  height={52}
                  fill={node.fill}
                  cornerRadius={9}
                  stroke={selected === node.id ? '#126d4e' : '#8ba49a'}
                  strokeWidth={selected === node.id ? 3 : 1}
                />
                <Text
                  x={9}
                  y={16}
                  width={115}
                  height={24}
                  text={node.title}
                  fontSize={15}
                  fill="#285647"
                  listening={false}
                />
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>
      <fieldset className="a12-controls">
        <legend>节点操作</legend>
        <label>
          选择节点{' '}
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">未选中</option>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.title}
              </option>
            ))}
          </select>
        </label>
        {selectedNode && (
          <button
            type="button"
            onClick={() =>
              update(selected, clampNodePosition({ x: selectedNode.x + 12, y: selectedNode.y }))
            }
          >
            键盘替代：右移12px
          </button>
        )}
        {level === 'advanced' && (
          <>
            <label>
              <input
                type="checkbox"
                checked={locked}
                onChange={(event) => setLocked(event.target.checked)}
              />
              锁定拖拽
            </label>
            <button
              type="button"
              disabled={!canAddNode(nodes.length)}
              onClick={() => {
                if (!canAddNode(nodes.length)) return
                const id = `step-${++nextNodeId.current}`
                setNodes((old) =>
                  canAddNode(old.length)
                    ? [
                        ...old,
                        {
                          id,
                          title: `步骤 ${old.length + 1}`,
                          ...newNodePosition(old.length),
                          fill: '#eee6d8',
                        },
                      ]
                    : old,
                )
                setSelected(id)
              }}
            >
              新增节点（上限 {MAX_NODES}）
            </button>
            <button
              type="button"
              disabled={!selectedNode}
              onClick={() => {
                if (!selected) return
                setNodes((old) => old.filter((node) => node.id !== selected))
                setSelected(nodes.find((node) => node.id !== selected)?.id ?? '')
              }}
            >
              删除当前
            </button>
          </>
        )}
      </fieldset>
      <p role="status" data-testid="a12-status">
        节点 {nodes.length}，缩放 {scale.toFixed(2)}，宽度 {width}px，当前{' '}
        {selectedNode?.title ?? '未选中'}。
      </p>
      <div className="a12-table-scroll">
        <table data-testid="a12-table">
          <caption>Canvas 节点的可访问数据表（坐标为世界单位）</caption>
          <thead>
            <tr>
              <th scope="col">节点</th>
              <th scope="col">坐标</th>
              <th scope="col">选择</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr
                key={node.id}
                data-node-id={node.id}
                data-x={node.x}
                data-y={node.y}
                data-selected={selected === node.id}
              >
                <th scope="row">{node.title}</th>
                <td>
                  ({node.x},{node.y})
                </td>
                <td>
                  <button type="button" onClick={() => setSelected(node.id)}>
                    选中{node.title}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Canvas图元不在DOM焦点顺序中；下拉、按钮和表格提供等价操作。锁定仅禁止拖拽，DOM移动与增删仍可用。
      </p>
    </section>
  )
}
