import { useId, useState } from 'react'
import {
  Group,
  type Layout,
  type LayoutChangedMeta,
  Panel,
  Separator,
} from 'react-resizable-panels'
import './panels.css'

type Level = 'basic' | 'business' | 'advanced'
type LayoutSnapshot = { layout: Layout; isUserInteraction: boolean }

export default function ResizableExample({ level }: { level: Level }) {
  const instanceId = useId()
  const [vertical, setVertical] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [snapshot, setSnapshot] = useState<LayoutSnapshot | null>(null)
  const orientation = level === 'advanced' && vertical ? 'vertical' : 'horizontal'
  const panels = [
    { key: 'explorer', label: '项目资源' },
    { key: 'main', label: level === 'basic' ? '详情预览' : '代码工作区' },
    ...(level === 'basic' ? [] : [{ key: 'inspector', label: '属性检查器' }]),
  ]

  function receiveLayout(layout: Layout, meta: LayoutChangedMeta) {
    // Initial mount and constraint changes are also reported by the SDK.
    setSnapshot({ layout: { ...layout }, isUserInteraction: meta.isUserInteraction })
  }

  return (
    <section
      aria-label="可调整尺寸的工作面板"
      className="b16-workshop"
      data-testid="b16-workshop"
      data-orientation={orientation}
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? '双栏：拖动与键盘约束'
          : level === 'business'
            ? '三栏：独立边界与稳定身份'
            : '方向切换与默认布局复位'}
      </h2>
      <p>
        拖动绿色分割条，或 Tab 聚焦后用方向键、Home、End 调整。尺寸由真实 Group / Panel / Separator
        管理，下方显示库回调的实际百分比；本例不保存到服务器或浏览器存储。
      </p>
      {level === 'advanced' && (
        <div className="b16-controls">
          <label>
            <input
              type="checkbox"
              checked={vertical}
              onChange={(event) => {
                setVertical(event.currentTarget.checked)
                setSnapshot(null)
              }}
            />
            纵向排列
          </label>
          <button
            type="button"
            onClick={() => {
              setGeneration((value) => value + 1)
              setSnapshot(null)
            }}
          >
            复位布局
          </button>
        </div>
      )}
      <div className="b16-frame">
        <Group
          id={`${instanceId}-group`}
          key={`${level}:${orientation}:${generation}`}
          orientation={orientation}
          onLayoutChanged={receiveLayout}
        >
          <Panel
            id={`${instanceId}-explorer`}
            data-b16-panel="explorer"
            defaultSize={level === 'basic' ? '35%' : '25%'}
            minSize="16%"
            maxSize="60%"
            className="b16-content b16-explorer"
          >
            <strong>项目资源</strong>
            <p>src / components / routes</p>
            <p>范围 16%–60%。面板内容可以滚动，不会把分割条挤出容器。</p>
          </Panel>
          <Separator
            id={`${instanceId}-separator-one`}
            aria-label="调整项目资源和主编辑区域"
            className="b16-separator"
          >
            <span aria-hidden="true">⋮</span>
          </Separator>
          <Panel
            id={`${instanceId}-main`}
            data-b16-panel="main"
            defaultSize={level === 'basic' ? '65%' : '45%'}
            minSize="22%"
            className="b16-content b16-main"
          >
            <strong>{level === 'basic' ? '详情预览' : '代码工作区'}</strong>
            <p>至少 22%。相邻面板共享可用空间，尺寸计算由 SDK 负责。</p>
            <pre>const example = 'ReactLoom';</pre>
          </Panel>
          {level !== 'basic' && (
            <>
              <Separator
                id={`${instanceId}-separator-two`}
                aria-label="调整编辑区域和检查面板"
                className="b16-separator"
              >
                <span aria-hidden="true">⋮</span>
              </Separator>
              <Panel
                id={`${instanceId}-inspector`}
                data-b16-panel="inspector"
                defaultSize="30%"
                minSize="15%"
                maxSize="55%"
                className="b16-content b16-inspector"
              >
                <strong>属性检查器</strong>
                <p>范围 15%–55%。F6 在本组分割条间循环，Shift+F6 反向。</p>
              </Panel>
            </>
          )}
        </Group>
      </div>
      <p role="status" data-testid="b16-layout-source">
        布局来源：
        {snapshot
          ? snapshot.isUserInteraction
            ? '用户输入（指针或键盘）'
            : '初始化或程序变更'
          : '等待 SDK 测量'}
      </p>
      <table className="b16-sizes" aria-label="SDK 提交的面板尺寸">
        <thead>
          <tr>
            <th scope="col">面板</th>
            <th scope="col">可用轴空间占比</th>
          </tr>
        </thead>
        <tbody>
          {panels.map((panel) => (
            <tr key={panel.key}>
              <th scope="row">{panel.label}</th>
              <td>
                {snapshot ? `${snapshot.layout[`${instanceId}-${panel.key}`]?.toFixed(1)}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <details>
        <summary>查看 SDK 原始布局映射</summary>
        <pre data-testid="b16-layout">
          {snapshot ? JSON.stringify(snapshot.layout, null, 2) : 'null'}
        </pre>
      </details>
      <p className="b16-note">
        占比基于扣除分割条后的可用轴空间；横向是宽度，纵向是高度。初始化、切换方向和复位也会触发
        onLayoutChanged，不能都当成用户拖动。复位会重新挂载 Group，原有尺寸被丢弃。
      </p>
    </section>
  )
}
