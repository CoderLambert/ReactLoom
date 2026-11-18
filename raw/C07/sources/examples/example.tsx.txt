import {
  createColumnHelper,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useTable,
} from '@tanstack/react-table'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { fetchLocalPage, type Response } from './fixture-page'
import { clampPageIndex, createPageRequestGate, tableQueryIdentity } from './page-policy.mjs'
import { type Feed, features, feedSeed } from './table-data'
import './workshop.css'

type Props = { level: 'basic' | 'business' | 'advanced' }
type OwnedResponse = Response & { identity: string; generation: number }
const EMPTY_RESPONSE: Response = { rows: [], total: 0 }

const helper = createColumnHelper<typeof features, Feed>()
const columns = helper.columns([
  helper.display({
    id: 'select',
    header: '选择',
    enableSorting: false,
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label={`选择 ${row.original.title}`}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }),
  helper.accessor('title', { header: 'RSS 来源', sortFn: 'text' }),
  helper.accessor('category', { header: '分类', sortFn: 'text' }),
  helper.accessor('subscribers', { header: '订阅数' }),
  helper.accessor('status', { header: '订阅状态', sortFn: 'text' }),
])

export default function TableExample({ level }: Props) {
  const advanced = level === 'advanced'
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const composing = useRef(false)
  const composingEndBefore = useRef(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: level === 'basic' ? 18 : 5,
  })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [remote, setRemote] = useState<OwnedResponse>({
    rows: [],
    total: 0,
    identity: '',
    generation: -1,
  })
  const [pendingIdentity, setPendingIdentity] = useState('')
  const [error, setError] = useState({ identity: '', message: '', generation: -1 })
  const [fail, setFail] = useState(false)
  const [retry, setRetry] = useState(0)
  const [serverLimit, setServerLimit] = useState(feedSeed.length)
  const requestGate = useRef<ReturnType<typeof createPageRequestGate> | null>(null)
  if (!requestGate.current) requestGate.current = createPageRequestGate()
  const identity = advanced
    ? tableQueryIdentity({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        query,
        fail,
        limit: serverLimit,
      })
    : ''
  const currentRemote: Response =
    advanced && remote.identity === identity && remote.generation === requestGate.current.revision()
      ? remote
      : EMPTY_RESPONSE
  const pending = advanced && pendingIdentity === identity
  const currentError =
    error.identity === identity && error.generation === requestGate.current.revision()
      ? error.message
      : ''
  useEffect(() => {
    setPagination((p) => {
      const size = level === 'basic' ? 18 : 5
      return p.pageIndex === 0 && p.pageSize === size ? p : { pageIndex: 0, pageSize: size }
    })
  }, [level])
  const clientRows = useMemo(
    () =>
      feedSeed.filter((x) => (x.title + x.category).toLowerCase().includes(query.toLowerCase())),
    [query],
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: retry intentionally restarts an unchanged query after explicit refresh.
  useEffect(() => {
    if (!advanced) {
      requestGate.current?.invalidate()
      return
    }
    const gate = requestGate.current
    if (!gate) return
    const lease = gate.begin()
    setPendingIdentity(identity)
    setError({ identity, message: '', generation: lease.generation })
    setRemote({ identity, generation: lease.generation, rows: [], total: 0 })
    void fetchLocalPage(
      {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sort: sorting,
        query,
        fail,
        limit: serverLimit,
      },
      lease.signal,
    )
      .then((result) => {
        if (!lease.owns()) return
        const corrected = clampPageIndex(pagination.pageIndex, pagination.pageSize, result.total)
        if (corrected !== pagination.pageIndex) {
          gate.invalidate()
          setPagination((p) => ({ ...p, pageIndex: corrected }))
          return // Re-fetch corrected page; never commit results for the old page.
        }
        setRemote({ ...result, identity, generation: lease.generation })
      })
      .catch((e) => {
        if (lease.owns()) setError({ identity, message: String(e), generation: lease.generation })
      })
      .finally(() => {
        if (lease.owns()) setPendingIdentity('')
        lease.close()
      })
    return () => lease.cancel()
  }, [
    advanced,
    identity,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    query,
    fail,
    retry,
    serverLimit,
  ])
  const invalidateAndRefresh = () => {
    requestGate.current?.invalidate()
    setRetry((value) => value + 1) // Force a fresh effect even if an updater returns the same state.
  }
  const onSort = (next: SortingState | ((previous: SortingState) => SortingState)) => {
    invalidateAndRefresh()
    setSorting((current) => (typeof next === 'function' ? next(current) : next).slice(0, 1))
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }
  const onPaginationChange = (
    next: PaginationState | ((current: PaginationState) => PaginationState),
  ) => {
    invalidateAndRefresh()
    setPagination(next)
  }
  const rows = advanced ? currentRemote.rows : clientRows
  const table = useTable({
    features,
    columns,
    data: rows,
    getRowId: (row) => row.id,
    manualSorting: advanced,
    manualPagination: advanced,
    rowCount: advanced ? currentRemote.total : undefined,
    state: { sorting, pagination, rowSelection },
    onSortingChange: onSort,
    onPaginationChange,
    onRowSelectionChange: setRowSelection,
    enableMultiSort: false,
  })
  const visible = table.getRowModel().rows
  const coreRows = table.getCoreRowModel().rows
  const sortedRows = table.getSortedRowModel().rows
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
  const modelSnapshot = {
    mode: advanced ? 'manual server page' : 'client',
    rawFixtureIds: feedSeed.map((row) => row.id),
    inputIds: rows.map((row) => row.id),
    coreIds: coreRows.map((row) => row.id),
    sortedIds: sortedRows.map((row) => row.id),
    visibleIds: visible.map((row) => row.id),
    selectedIds,
    materializedSelectedIds: table.getSelectedRowModel().rows.map((row) => row.id),
    sorting,
    pagination,
    requestIdentity: advanced ? identity : null,
  }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (composing.current) return
    invalidateAndRefresh()
    setQuery(draft.trim())
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }
  return (
    <section
      className="c07-workshop"
      aria-label="TanStack Table v9 实际表格"
      data-testid="c07-workshop"
    >
      <h2>
        {level === 'basic'
          ? 'Headless 表格与稳定 rowId'
          : level === 'business'
            ? '本地筛选、排序和分页'
            : '手动分页、失败和请求竞态'}
      </h2>
      <p>
        运行官方 v9 表格引擎。数据为本地 RSS fixture；高级模式用可取消延迟模拟服务端，不伪称真实
        HTTP。
      </p>
      {level !== 'basic' && (
        <form
          onSubmit={search}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              (event.nativeEvent.isComposing ||
                event.nativeEvent.keyCode === 229 ||
                composing.current ||
                Date.now() < composingEndBefore.current)
            )
              event.preventDefault()
          }}
          className="demo-controls"
        >
          <label>
            检索 RSS 来源
            <input
              aria-label="检索RSS来源"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onCompositionStart={() => {
                composing.current = true
                composingEndBefore.current = 0
              }}
              onCompositionEnd={(e) => {
                composing.current = false
                composingEndBefore.current = Date.now() + 80
                setDraft(e.currentTarget.value)
              }}
            />
          </label>
          <button type="submit">查询</button>
        </form>
      )}
      {advanced && (
        <div className="demo-controls">
          <button
            type="button"
            onClick={() => {
              invalidateAndRefresh()
              setFail(false)
              setServerLimit(feedSeed.length)
            }}
          >
            恢复并刷新
          </button>
          <button
            type="button"
            onClick={() => {
              invalidateAndRefresh()
              setServerLimit(2)
            }}
          >
            模拟后台缩减到2条
          </button>
          <button
            type="button"
            onClick={() => {
              invalidateAndRefresh()
              setFail(true)
            }}
          >
            模拟服务端 503
          </button>
        </div>
      )}
      <p data-testid="c07-model-summary">
        原始fixture {feedSeed.length} 行 → 传入data {rows.length} 行 → core {coreRows.length} 行 →
        sorted {sortedRows.length} 行 → DOM {visible.length} 行
      </p>
      <p>
        {advanced
          ? '服务端模式：传入的已经是一页，Table不再排序或切页。'
          : '客户端模式：应用先筛选全部fixture，Table再排序和分页。'}
      </p>
      <p
        role="status"
        data-testid="c07-status"
        data-pending={pending}
        data-error={Boolean(currentError)}
      >
        {pending ? '正在读取本地服务端分页…' : currentError || `当前显示 ${visible.length} 行`}
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table data-testid="c07-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <caption>RSS 订阅来源，选中状态按持久业务 ID 保存</caption>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const direction = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        direction === 'asc'
                          ? 'ascending'
                          : direction === 'desc'
                            ? 'descending'
                            : 'none'
                      }
                      style={{
                        borderBottom: '1px solid #ccd7cb',
                        padding: '10px',
                        textAlign: 'left',
                      }}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button type="button" onClick={header.column.getToggleSortingHandler()}>
                          <table.FlexRender header={header} />
                          {direction === 'asc' ? ' ↑' : direction === 'desc' ? ' ↓' : ''}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} data-row-id={row.id}>
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} style={{ borderBottom: '1px solid #e1e8db', padding: '10px' }}>
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5}>
                  {pending
                    ? '正在读取该页…'
                    : currentError
                      ? '本次读取失败，未提交旧页数据'
                      : '没有匹配的来源'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {level !== 'basic' && (
        <div className="demo-controls" data-testid="c07-pager">
          <button
            type="button"
            disabled={pending || !table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            上一页
          </button>
          <span>
            {advanced && (pending || currentRemote === EMPTY_RESPONSE)
              ? `第${pagination.pageIndex + 1}页（读取当前结果中）`
              : currentError
                ? `第${pagination.pageIndex + 1}页（读取失败）`
                : `第${pagination.pageIndex + 1} / ${Math.max(1, table.getPageCount())}页`}
          </span>
          <button
            type="button"
            disabled={pending || !table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            下一页
          </button>
          <label>
            每页
            <select
              aria-label="每页行数"
              value={pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[3, 5, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <p data-testid="c07-selection" data-selected-count={selectedIds.length}>
        已选中的业务 ID：{selectedIds.join(', ') || '暂无'}
        <button type="button" onClick={() => setRowSelection({})}>
          清空选择
        </button>
      </p>
      <p>
        选择ID状态可跨页；getSelectedRowModel只能把当前传入data中的ID转换为行，不能从未加载的远程页推断实体。
      </p>
      <details>
        <summary>查看原始数据、行模型与选择ID</summary>
        <pre data-testid="c07-row-model">{JSON.stringify(modelSnapshot, null, 2)}</pre>
      </details>
    </section>
  )
}
