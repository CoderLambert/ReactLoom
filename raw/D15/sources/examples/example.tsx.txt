import Dexie from 'dexie'
import { useEffect, useRef, useState } from 'react'
import {
  createFeedDatabase,
  feedSeed,
  findGroupByTime,
  findGroupTimeRange,
  writeDuplicateBatch,
} from './feed-database.mjs'
import { type FeedSnapshot, sameFeedSnapshot } from './rollback-policy.mjs'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
type Feed = FeedSnapshot
type LegacyFeed = Omit<Feed, 'read'> & { read?: boolean }
type Result =
  | { kind: 'basic'; group: string; rows: Feed[] }
  | { kind: 'business'; before: Feed[]; after: Feed[]; error: string; unchanged: boolean }
  | { kind: 'advanced'; before: LegacyFeed[]; rows: Feed[]; version: number }

const scenarios = {
  basic: {
    title: '按分组查找，再按更新时间排序',
    description: '用 group 索引筛出 RSS，再把命中结果读入内存，按 updatedAt 升序排列。',
    action: '查询分组',
    steps: ['写入 3 条 RSS fixture', '选择分组并执行查询', '核对分组、时间顺序与已读状态'],
  },
  business: {
    title: '一次重复键，撤销整批写入',
    description: '事务先写入 rss-d，再 add 已存在的 rss-a。让错误离开事务，观察两笔写入一起回滚。',
    action: '触发重复键并检查回滚',
    steps: ['保存事务前的完整快照', '在同一 rw 事务里写入并制造重复键', '逐字段比较前后结果'],
  },
  advanced: {
    title: '把真实 v1 数据升级到 v2',
    description: '先建立 v1 并写入缺少 read 的遗留行，再关闭连接，以 v2 打开同一数据库。',
    action: '创建 v1，再升级到 v2',
    steps: [
      'v1 存入 3 条 fixture 和 1 条遗留行',
      'v2 upgrader 只补缺少的 read',
      '用复合索引查询技术分组的时间范围',
    ],
  },
} satisfies Record<Level, { title: string; description: string; action: string; steps: string[] }>

function FeedTable({ rows, caption }: { rows: LegacyFeed[]; caption: string }) {
  return (
    <div className="dexie-table-scroll">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">RSS 主键</th>
            <th scope="col">分组</th>
            <th scope="col">更新时间</th>
            <th scope="col">已读</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((feed) => (
            <tr key={feed.id}>
              <th scope="row">
                <code>{feed.id}</code>
              </th>
              <td>{feed.group}</td>
              <td>{feed.updatedAt}</td>
              <td>
                {feed.read === undefined ? '缺少字段' : feed.read ? '已读 · true' : '未读 · false'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ResultView({ result }: { result: Result }) {
  if (result.kind === 'basic') {
    return (
      <>
        <h3>
          {result.group}分组：{result.rows.length} 条，按更新时间升序
        </h3>
        <p>
          <code>where('group').equals('{result.group}').sortBy('updatedAt')</code>
        </p>
        <FeedTable rows={result.rows} caption="查询结果 · 时间单位为演示刻度" />
        <p className="dexie-note">
          group 索引负责筛选；sortBy
          在结果数组上排序。大列表需要按分组与时间读取时，查看进阶场景的复合索引。
        </p>
      </>
    )
  }
  if (result.kind === 'business') {
    return (
      <>
        <h3>
          {result.unchanged && result.error === 'ConstraintError'
            ? '已确认原子回滚'
            : '回滚结果不符合预期'}
        </h3>
        <dl className="dexie-facts">
          <div>
            <dt>事务错误</dt>
            <dd>{result.error || '没有捕获到错误'}</dd>
          </div>
          <div>
            <dt>记录数</dt>
            <dd>
              {result.before.length} → {result.after.length}
            </dd>
          </div>
          <div>
            <dt>全部业务字段</dt>
            <dd>{result.unchanged ? '前后一致' : '存在变化'}</dd>
          </div>
          <div>
            <dt>新行 rss-d</dt>
            <dd>{result.after.some((row) => row.id === 'rss-d') ? '仍然存在' : '没有留下'}</dd>
          </div>
        </dl>
        <div className="dexie-comparison">
          <FeedTable rows={result.before} caption="事务之前" />
          <FeedTable rows={result.after} caption="事务失败之后" />
        </div>
        <p className="dexie-note">
          不只比较行数：id、group、updatedAt、read 必须逐项相同。catch
          位于事务外，捕获的是整个事务的失败。
        </p>
      </>
    )
  }
  const legacy = result.rows.find((row) => row.id === 'rss-legacy')
  const existingRead = result.rows.find((row) => row.id === 'rss-b')
  const migrated = result.version === 2 && legacy?.read === false && existingRead?.read === true
  return (
    <>
      <h3>
        当前版本 v{result.version}：{migrated ? '遗留字段已回填' : '升级结果不符合预期'}
      </h3>
      <dl className="dexie-facts">
        <div>
          <dt>rss-legacy.read</dt>
          <dd>缺少字段 → {String(legacy?.read)}</dd>
        </div>
        <div>
          <dt>rss-b.read</dt>
          <dd>true → {String(existingRead?.read)}（保留已有值）</dd>
        </div>
      </dl>
      <p>
        <code>[group+updatedAt]</code> 查询：技术分组，更新时间 100–250，含两端。
      </p>
      <FeedTable rows={result.rows} caption="v2 复合索引结果 · 按更新时间升序" />
      <details>
        <summary>查看升级前的 v1 记录</summary>
        <FeedTable rows={result.before} caption="v1 原始记录 · rss-legacy 没有 read" />
      </details>
      <p className="dexie-note">
        当前 v2 声明省略了没有 upgrader 的 v1。Dexie 3
        起允许这样升级；仍有旧客户端时，要保留它们需要经过的数据 upgrader。全新数据库直接创建
        v2，不运行 upgrade 回填。
      </p>
    </>
  )
}

export default function DexieWorkshop({ level }: { level: Level }) {
  const [status, setStatus] = useState('尚未执行。点击按钮创建独立临时数据库。')
  const [result, setResult] = useState<Result | null>(null)
  const [group, setGroup] = useState('技术')
  const [busy, setBusy] = useState(false)
  const epoch = useRef(0)
  const opened = useRef<Dexie | null>(null)
  const names = useRef(new Set<string>())
  const activeLevel = useRef(level)
  const scenario = scenarios[level]

  useEffect(
    () => () => {
      epoch.current++
      opened.current?.close()
      // Best effort on unmount; the running session also deletes its own database.
      for (const name of names.current) void Dexie.delete(name).catch(() => {})
    },
    [],
  )

  useEffect(() => {
    if (activeLevel.current === level) return
    activeLevel.current = level
    epoch.current++
    opened.current?.close()
    opened.current = null
    setBusy(false)
    setResult(null)
    setStatus('场景已切换。旧连接已关闭，旧结果不会回写。')
  }, [level])

  async function execute() {
    if (busy) return
    const token = ++epoch.current
    setBusy(true)
    setResult(null)
    setStatus('正在运行 IndexedDB 场景…')
    let name: string | undefined
    let db: Dexie | undefined
    try {
      if (typeof indexedDB === 'undefined') throw new Error('浏览器未提供 IndexedDB')
      if (typeof globalThis.crypto?.randomUUID !== 'function') {
        throw new Error('当前环境无法生成安全随机库名，请使用 HTTPS 或 localhost')
      }
      // Initialization belongs inside try: UUID/configuration failures also release busy.
      name = `reactloom-lab-d15-${globalThis.crypto.randomUUID()}`
      names.current.add(name)
      db = createFeedDatabase(name)
      opened.current = db
      await db.open()
      if (token !== epoch.current) return
      const table = db.table<Feed, string>('feeds')
      await table.bulkPut(feedSeed)
      if (token !== epoch.current) return
      let next: Result
      if (level === 'basic') {
        next = { kind: 'basic', group, rows: await findGroupByTime(table, group) }
      } else if (level === 'business') {
        const before = await table.toArray()
        let errorName = ''
        try {
          await writeDuplicateBatch(db)
        } catch (error) {
          errorName = error instanceof Error ? error.name : String(error)
        }
        const after = await table.toArray()
        next = {
          kind: 'business',
          before,
          after,
          error: errorName,
          unchanged: sameFeedSnapshot(before, after),
        }
      } else {
        await db
          .table<LegacyFeed, string>('feeds')
          .put({ id: 'rss-legacy', group: '技术', updatedAt: 250 })
        const before = await db.table<LegacyFeed, string>('feeds').toArray()
        if (token !== epoch.current) return
        db.close()
        db = createFeedDatabase(name, 2)
        opened.current = db
        await db.open()
        const rows = await findGroupTimeRange(db.table<Feed, string>('feeds'), '技术', 100, 250)
        next = { kind: 'advanced', before, rows, version: db.verno }
      }
      if (token === epoch.current) {
        setResult(next)
        setStatus('场景已完成，正在删除本次临时数据库…')
      }
    } catch (error) {
      if (token === epoch.current) setStatus(`执行失败：${String(error)}。可以重试。`)
    } finally {
      db?.close()
      if (opened.current === db) opened.current = null
      let cleanupError: unknown
      if (name) {
        try {
          // Delete only this session's name; never enumerate origin databases.
          await Dexie.delete(name)
          names.current.delete(name)
        } catch (error) {
          cleanupError = error // Keep this owned name for unmount retry.
        }
      }
      if (token === epoch.current) {
        setBusy(false)
        if (cleanupError) setStatus(`结果已保留，但本次临时数据库清理失败：${String(cleanupError)}`)
        else
          setStatus((current) =>
            current.startsWith('场景已完成')
              ? '场景已完成，本次临时数据库已删除。可以重新执行。'
              : current,
          )
      }
    }
  }

  return (
    <section className="dexie-workshop" aria-label="Dexie 真实 IndexedDB 示例" aria-busy={busy}>
      <header>
        <p className="dexie-eyebrow">离线 RSS 阅读器 · Dexie 4.4.7</p>
        <h2>{scenario.title}</h2>
        <p>{scenario.description}</p>
      </header>
      <ol className="dexie-steps">
        {scenario.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="dexie-controls">
        {level === 'basic' && (
          <label>
            RSS 分组
            <select
              value={group}
              disabled={busy}
              onChange={(event) => setGroup(event.target.value)}
            >
              <option>技术</option>
              <option>商业</option>
            </select>
          </label>
        )}
        <button type="button" disabled={busy} onClick={() => void execute()}>
          {busy ? '执行中…' : scenario.action}
        </button>
      </div>
      <p role="status" className="dexie-status">
        {status}
      </p>
      <div data-testid="dexie-output" className="dexie-results">
        {result ? (
          <>
            <ResultView result={result} />
            <details>
              <summary>查看本次原始数据</summary>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </details>
          </>
        ) : (
          <p>运行后在这里查看真实查询结果。时间使用固定演示刻度，数据来自本地 fixture。</p>
        )}
      </div>
      <p className="dexie-note">
        每次运行只操作自己的随机数据库，结束后删除。这里演示本地存储与事务；网络同步和跨标签协作需要另行设计。
      </p>
    </section>
  )
}
