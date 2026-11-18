import GridLayout, { type Layout, useContainerWidth, verticalCompactor } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useMemo, useState } from 'react'
import './styles.css'
import {
  initialNarrowCells,
  keyboardMove,
  keyboardResize,
  projectCells,
  sameGeometry,
} from './layout-policy'

type Level = 'basic' | 'business' | 'advanced'
type Breakpoint = 'wide' | 'narrow'
const defaults: Layout = [
  { i: 'headline', x: 0, y: 0, w: 4, h: 2, minW: 2, maxW: 8 },
  { i: 'feed', x: 4, y: 0, w: 4, h: 2, minW: 2, maxW: 8 },
  { i: 'queue', x: 8, y: 0, w: 4, h: 2, minW: 2, maxW: 8 },
]
const labels: Record<string, string> = {
  headline: '新闻总览',
  feed: '订阅趋势',
  queue: '待审列表',
}
type LayoutModel = { wide: Layout; narrow: Layout; changes: number }
function initialModel(): LayoutModel {
  return {
    wide: defaults.map((item) => ({ ...item })),
    narrow: initialNarrowCells(defaults),
    changes: 0,
  }
}
export default function GridExample({ level }: { level: Level }) {
  const [model, setModel] = useState<LayoutModel>(initialModel)
  const [locked, setLocked] = useState(false)
  const [narrowContainer, setNarrowContainer] = useState(false)
  const [sdk, setSdk] = useState<{
    dragStops: number
    resizeStops: number
    last: null | { kind: 'drag' | 'resize'; i: string; x: number; y: number; w: number; h: number }
  }>({ dragStops: 0, resizeStops: 0, last: null })
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true })
  const breakpoint: Breakpoint = width < 640 ? 'narrow' : 'wide'
  const cols = breakpoint === 'narrow' ? 6 : 12
  const frozen = level === 'advanced' && locked ? ['headline'] : []
  const visibleLayout = useMemo(
    () =>
      projectCells(model[breakpoint], cols).map((item) => ({
        ...item,
        static: level === 'advanced' && locked && item.i === 'headline',
      })),
    [model, breakpoint, cols, level, locked],
  )
  const interactive = level !== 'basic'

  function onChange(next: Layout) {
    setModel((previous) => {
      const previousCells = projectCells(previous[breakpoint], cols)
      const clean = next.map((item) => {
        const previousLocked = frozen.includes(item.i)
          ? previousCells.find((cell) => cell.i === item.i)
          : undefined
        return {
          ...item,
          x: previousLocked?.x ?? item.x,
          y: previousLocked?.y ?? item.y,
          w: previousLocked?.w ?? item.w,
          h: previousLocked?.h ?? item.h,
          static: false,
        }
      })
      if (sameGeometry(previous[breakpoint], clean)) return previous
      return { ...previous, [breakpoint]: clean, changes: previous.changes + 1 }
    })
  }
  function moveByKeyboard(id: string, direction: -1 | 1) {
    setModel((previous) => {
      const cells = projectCells(previous[breakpoint], cols)
      const next = keyboardMove(cells, id, direction, cols, frozen)
      if (next === cells || sameGeometry(cells, next)) return previous
      return {
        ...previous,
        [breakpoint]: next.map((item) => ({ ...item, static: false })),
        changes: previous.changes + 1,
      }
    })
  }
  function resizeByKeyboard(id: string, direction: -1 | 1) {
    setModel((previous) => {
      const cells = projectCells(previous[breakpoint], cols)
      const next = keyboardResize(cells, id, direction, cols, frozen)
      if (next === cells || sameGeometry(cells, next)) return previous
      return {
        ...previous,
        [breakpoint]: next.map((item) => ({ ...item, static: false })),
        changes: previous.changes + 1,
      }
    })
  }
  function reset() {
    setLocked(false)
    setSdk({ dragStops: 0, resizeStops: 0, last: null })
    setModel((previous) => ({ ...initialModel(), changes: previous.changes + 1 }))
  }
  return (
    <section
      aria-label="React Grid Layout 实际看板"
      className="b15-workshop"
      data-testid="b15-workshop"
      data-mounted={mounted}
      data-breakpoint={breakpoint}
      data-cols={cols}
    >
      <h2>
        {level === 'basic'
          ? '容器测量与只读网格'
          : level === 'business'
            ? '句柄拖动、缩放与回写'
            : '断点草稿、锁定与键盘替代'}
      </h2>
      <p role="status" data-testid="b15-status">
        真实 react-grid-layout v2 控制式布局。容器
        {mounted ? `实测 ${Math.round(width)}px / ${cols} 列` : '正在测量'}，几何变更{' '}
        {model.changes} 次；宽窄布局独立存储。
      </p>
      <div className="b15-controls">
        <label>
          容器宽度{' '}
          <select
            aria-label="容器宽度"
            value={narrowContainer ? 'narrow' : 'auto'}
            onChange={(event) => setNarrowContainer(event.target.value === 'narrow')}
          >
            <option value="auto">跟随可用空间</option>
            <option value="narrow">窄容器（最多580px）</option>
          </select>
        </label>
        <button type="button" onClick={reset}>
          重置宽窄布局
        </button>
        {level === 'advanced' && (
          <label>
            <input
              type="checkbox"
              checked={locked}
              onChange={(event) => setLocked(event.target.checked)}
            />
            锁定新闻总览
          </label>
        )}
      </div>
      <div
        ref={containerRef}
        className="b15-container"
        data-testid="b15-container"
        style={{ maxWidth: narrowContainer ? 580 : undefined }}
      >
        {mounted && width > 0 ? (
          <GridLayout
            key={breakpoint}
            width={width}
            layout={visibleLayout}
            onLayoutChange={onChange}
            onDragStop={(_layout, _old, item) => {
              if (item) {
                const { i, x, y, w, h } = item
                setSdk((previous) => ({
                  ...previous,
                  dragStops: previous.dragStops + 1,
                  last: { kind: 'drag', i, x, y, w, h },
                }))
              }
            }}
            onResizeStop={(_layout, _old, item) => {
              if (item) {
                const { i, x, y, w, h } = item
                setSdk((previous) => ({
                  ...previous,
                  resizeStops: previous.resizeStops + 1,
                  last: { kind: 'resize', i, x, y, w, h },
                }))
              }
            }}
            gridConfig={{ cols, rowHeight: 78, margin: [10, 10] }}
            dragConfig={{ enabled: interactive, handle: '.lab-grid-handle', bounded: true }}
            resizeConfig={{ enabled: interactive, handles: ['se'] }}
            compactor={verticalCompactor}
          >
            {visibleLayout.map((item) => (
              <div
                key={item.i}
                className="b15-card"
                data-testid={`b15-card-${item.i}`}
                data-grid-id={item.i}
              >
                <div className="lab-grid-handle" data-movable={interactive && !item.static}>
                  {labels[item.i]} {item.static ? '🔒' : ''}
                </div>
                <p className="b15-cell-info">
                  位置 {item.x}/{item.y}；占用 {item.w}×{item.h}
                </p>
                <div className="b15-cell-controls">
                  <button
                    className="lab-grid-control"
                    type="button"
                    disabled={
                      !interactive ||
                      keyboardMove(visibleLayout, item.i, -1, cols, frozen) === visibleLayout
                    }
                    onClick={() => moveByKeyboard(item.i, -1)}
                    aria-label={(cols === 6 ? '向上移动' : '向左移动') + labels[item.i]}
                  >
                    {cols === 6 ? '↑' : '←'}
                  </button>
                  <button
                    className="lab-grid-control"
                    type="button"
                    disabled={
                      !interactive ||
                      keyboardMove(visibleLayout, item.i, 1, cols, frozen) === visibleLayout
                    }
                    onClick={() => moveByKeyboard(item.i, 1)}
                    aria-label={(cols === 6 ? '向下移动' : '向右移动') + labels[item.i]}
                  >
                    {cols === 6 ? '↓' : '→'}
                  </button>
                  <button
                    className="lab-grid-control"
                    type="button"
                    disabled={
                      !interactive ||
                      keyboardResize(visibleLayout, item.i, -1, cols, frozen) === visibleLayout
                    }
                    onClick={() => resizeByKeyboard(item.i, -1)}
                    aria-label={`缩窄${labels[item.i]}`}
                  >
                    −宽
                  </button>
                  <button
                    className="lab-grid-control"
                    type="button"
                    disabled={
                      !interactive ||
                      keyboardResize(visibleLayout, item.i, 1, cols, frozen) === visibleLayout
                    }
                    onClick={() => resizeByKeyboard(item.i, 1)}
                    aria-label={`加宽${labels[item.i]}`}
                  >
                    ＋宽
                  </button>
                </div>
              </div>
            ))}
          </GridLayout>
        ) : (
          <p role="status">正在测量容器宽度…</p>
        )}
      </div>
      <h3>可序列化的结构化布局</h3>
      <pre data-testid="b15-layout">
        <code>
          {JSON.stringify(
            visibleLayout.map(({ i, x, y, w, h, static: fixed }) => ({
              i,
              x,
              y,
              w,
              h,
              static: !!fixed,
            })),
            null,
            2,
          )}
        </code>
      </pre>
      <details>
        <summary>查看断点模型与实际SDK回调</summary>
        <pre data-testid="b15-state">
          {JSON.stringify(
            {
              mounted,
              width,
              breakpoint,
              cols,
              locked,
              changes: model.changes,
              wide: model.wide,
              narrow: model.narrow,
              sdk,
            },
            null,
            2,
          )}
        </pre>
      </details>
      <p>
        坐标/尺寸按格子记录；SDK处理碰撞并向上压缩，按钮是自建键盘替代。锁定项不动，窄屏交换不跨锁定邻居；重置只恢复两份布局/锁与本轮回调记录，不改变容器宽度。内存fixture，无HTTP或持久化。
      </p>
    </section>
  )
}
