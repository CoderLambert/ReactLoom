import type {
  CellEditingStartedEvent,
  CellEditRequestEvent,
  ColDef,
  GridApi,
} from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyStatusEdit, reconcileFeedSnapshot } from './edit-policy.mjs'
import { captureEdit, type EditSession, expectedRevision } from './edit-session'
import {
  createColumns,
  GRID_THEME,
  getSourceId,
  MODULES,
  makeRows,
  type Source,
  STATUSES,
  type Status,
} from './grid-contract'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
type Observation = {
  modelRows: number
  page: number
  pages: number
  pageSize: number
  firstIds: string[]
}
const EMPTY: Observation = { modelRows: 0, page: 0, pages: 0, pageSize: 0, firstIds: [] }
const counts = { basic: 12, business: 150, advanced: 1500 }

export default function AgGridExample({ level }: { level: Level }) {
  const [rows, setRows] = useState(() => makeRows(counts[level]))
  const rowsRef = useRef(rows)
  const [filter, setFilter] = useState('')
  const [status, setStatus] = useState('本地数据就绪')
  const [lastEdit, setLastEdit] = useState('尚未编辑')
  const [sessionView, setSessionView] = useState('尚未开始编辑')
  const [observation, setObservation] = useState(EMPTY)
  const session = useRef<EditSession | null>(null)
  const controller = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const grid = useRef<GridApi<Source> | null>(null)
  const columns = useMemo(createColumns, [])
  const defaults = useMemo<ColDef<Source>>(() => ({ sortable: true, resizable: true }), [])

  useEffect(() => {
    const snapshot = makeRows(counts[level])
    rowsRef.current = snapshot
    setRows(snapshot)
    setFilter('')
    setStatus('本地数据就绪')
    setLastEdit('尚未编辑')
    session.current = null
    return () => {
      generation.current++
      controller.current?.abort()
      controller.current = null
      session.current = null
      grid.current = null
    }
  }, [level])

  const observe = useCallback(
    (api: GridApi<Source>) => {
      if (api.isDestroyed()) return
      const modelRows = api.getDisplayedRowCount()
      const page = level === 'basic' ? 0 : api.paginationGetCurrentPage()
      const pageSize = level === 'basic' ? modelRows : api.paginationGetPageSize()
      const firstIds = Array.from(
        { length: Math.min(3, Math.max(0, modelRows - page * pageSize)) },
        (_, index) => api.getDisplayedRowAtIndex(page * pageSize + index)?.data?.id ?? '',
      )
      const next = {
        modelRows,
        page,
        pages: level === 'basic' ? (modelRows ? 1 : 0) : api.paginationGetTotalPages(),
        pageSize,
        firstIds,
      }
      setObservation((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      )
    },
    [level],
  )

  const startEdit = useCallback((event: CellEditingStartedEvent<Source>) => {
    if (event.colDef.field !== 'status') return
    session.current = captureEdit(event.data)
    setSessionView(
      session.current
        ? `${session.current.id}；开始版本 ${session.current.revision}`
        : '缺少行数据',
    )
  }, [])
  const requestEdit = useCallback((event: CellEditRequestEvent<Source>) => {
    if (event.colDef.field !== 'status' || !event.data) return
    const revision = expectedRevision(session.current, event.data.id)
    session.current = null
    if (
      revision === null ||
      typeof event.newValue !== 'string' ||
      !STATUSES.includes(event.newValue as Status)
    ) {
      setStatus('编辑拒绝：缺少开始时版本或状态非法')
      return
    }
    const result = applyStatusEdit(rowsRef.current, event.data.id, event.newValue, revision)
    if (result.outcome === 'applied') {
      rowsRef.current = result.rows
      setRows(result.rows)
      setLastEdit(
        `${event.data.id} → ${event.newValue}；期望版本 ${revision}；新版本 ${revision + 1}`,
      )
      setStatus('状态编辑已按 revision 提交到本地模型')
    } else
      setStatus(
        result.outcome === 'conflict'
          ? '409：旧版本编辑已拒绝；请重新开始编辑'
          : `编辑结果：${result.outcome}`,
      )
  }, [])
  const shown = useMemo(
    () =>
      filter
        ? rows.filter((row) => row.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))
        : rows,
    [rows, filter],
  )

  function simulateExternalUpdate() {
    const current = rowsRef.current.find((row) => row.id === 'feed-0001')
    if (!current) return
    const nextStatus = current.status === 'error' ? 'active' : 'error'
    const result = applyStatusEdit(rowsRef.current, current.id, nextStatus, current.revision)
    if (result.outcome !== 'applied') return
    rowsRef.current = result.rows
    setRows(result.rows)
    setStatus(`本地外部更新 fixture：${current.id} → ${nextStatus}；新版本 ${current.revision + 1}`)
  }

  async function reload(delay: number) {
    generation.current++
    controller.current?.abort()
    const sequence = generation.current
    const next = new AbortController()
    controller.current = next
    setStatus(`正在加载本地快照（${delay}ms）`)
    try {
      await new Promise<void>((resolve, reject) => {
        const cancel = () => {
          window.clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        }
        const timer = window.setTimeout(() => {
          next.signal.removeEventListener('abort', cancel)
          resolve()
        }, delay)
        next.signal.addEventListener('abort', cancel, { once: true })
      })
      if (sequence !== generation.current || next.signal.aborted) return
      const refreshed = reconcileFeedSnapshot(rowsRef.current, makeRows(counts[level]))
      rowsRef.current = refreshed
      setRows(refreshed)
      setStatus(`已接收最新快照（${delay}ms）；保留较新的本地状态`)
    } catch {
      if (sequence === generation.current) setStatus('已取消上一批请求')
    } finally {
      if (controller.current === next) controller.current = null
    }
  }

  return (
    <section
      className="c08-workshop"
      aria-label="AG Grid Community 网格"
      data-testid="c08-workshop"
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? '数据、列与网格行模型'
          : level === 'business'
            ? '客户端分页与受控编辑'
            : '快照竞态与 revision 冲突'}
      </h2>
      <p>
        仅 Community 36.2.0。总数 <span data-testid="c08-total">{rows.length}</span>，传入网格{' '}
        <span data-testid="c08-input-count">{shown.length}</span>；全部 fixture 已在浏览器内存。
      </p>
      {level !== 'basic' && (
        <label>
          过滤频道名称{' '}
          <input
            aria-label="过滤频道名称"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="输入 Frontend"
          />
        </label>
      )}
      {level === 'advanced' && (
        <div className="demo-controls">
          <button type="button" onClick={() => void reload(700)}>
            启动慢数据加载
          </button>
          <button type="button" onClick={() => void reload(100)}>
            启动快数据加载
          </button>
          <button
            type="button"
            onClick={() => {
              generation.current++
              controller.current?.abort()
              controller.current = null
              setStatus('已取消')
            }}
          >
            取消加载
          </button>
          <button type="button" data-testid="c08-external-update" onClick={simulateExternalUpdate}>
            模拟外部更新首行
          </button>
          <button
            type="button"
            onClick={() =>
              setStatus(
                `模拟旧版本写入：${applyStatusEdit(rowsRef.current, 'feed-0001', 'paused', 0).outcome}（期望 conflict）`,
              )
            }
          >
            模拟旧版本编辑
          </button>
        </div>
      )}
      <p role="status" data-testid="c08-status">
        {status}。上一次状态编辑：{lastEdit}
      </p>
      <p data-testid="c08-edit-session">{sessionView}</p>
      <output className="c08-observation" data-testid="c08-model">
        {JSON.stringify(observation)}
      </output>
      <AgGridProvider modules={MODULES}>
        <div className="c08-grid" data-testid="c08-grid">
          <AgGridReact<Source>
            rowData={shown}
            columnDefs={columns}
            defaultColDef={defaults}
            theme={GRID_THEME}
            getRowId={getSourceId}
            readOnlyEdit
            onCellEditingStarted={startEdit}
            onCellEditRequest={requestEdit}
            onCellEditingStopped={() => {
              session.current = null
            }}
            onGridReady={(event) => {
              grid.current = event.api
              observe(event.api)
            }}
            onGridPreDestroyed={() => {
              grid.current = null
              session.current = null
            }}
            onModelUpdated={(event) => observe(event.api)}
            onPaginationChanged={(event) => observe(event.api)}
            pagination={level !== 'basic'}
            paginationPageSize={25}
            paginationPageSizeSelector={[25, 50, 100]}
          />
        </div>
      </AgGridProvider>
      <details>
        <summary>查看当前业务数据</summary>
        <pre data-testid="c08-data">{JSON.stringify(rows.slice(0, 3), null, 2)}</pre>
      </details>
      <p>
        双击状态列或聚焦后按 Enter，选择
        active/paused/error。应用保存编辑开始时版本，readOnlyEdit只提出请求；Escape取消由网格处理。模型读数来自真实GridApi，不是React数组推测。1500行不是性能结论。
      </p>
    </section>
  )
}
