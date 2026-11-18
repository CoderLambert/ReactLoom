import { chunk, debounce, groupBy, orderBy, uniqBy } from 'lodash-es'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Feed = { id: string; category: string; title: string; score: number }
const feeds: Feed[] = [
  { id: 'ai', category: 'tech', title: '模型推理实践', score: 81 },
  { id: 'web', category: 'tech', title: 'React 工程演进', score: 92 },
  { id: 'ai', category: 'tech', title: '重复但高分', score: 99 },
  { id: 'market', category: 'business', title: '产品与市场', score: 84 },
  { id: 'world', category: 'news', title: '国际要闻', score: 74 },
]
export function buildDigest(source: Feed[], highestFirst: boolean) {
  const candidates = highestFirst ? orderBy(source, ['score', 'id'], ['desc', 'asc']) : source
  const unique = uniqBy(candidates, 'id')
  const groups = Object.entries(groupBy(unique, 'category')).map(([category, items]) => ({
    category,
    items: orderBy(items, ['score', 'id'], ['desc', 'asc']),
  }))
  return { unique, groups, batches: chunk(unique, 3) }
}
function CollectionExperiment() {
  const [highest, setHighest] = useState(false)
  const digest = buildDigest(feeds, highest)
  return (
    <section aria-label="集合处理实验">
      <h2>先排序还是先去重</h2>
      <p>本地五条 fixture；重复 ai 的分数为 81 和 99。切换顺序，观察留下哪条。</p>
      <label>
        <input type="checkbox" checked={highest} onChange={(e) => setHighest(e.target.checked)} />
        先按分数排序再去重
      </label>
      <output data-testid="d02-collection">{JSON.stringify(digest, null, 2)}</output>
    </section>
  )
}
type Observer = (value: string) => void
function SearchInput({ onApply }: { onApply: Observer }) {
  const [query, setQuery] = useState('')
  const composing = useRef(false)
  const schedule = useMemo(() => debounce(onApply, 400), [onApply])
  useEffect(() => () => schedule.cancel(), [schedule])
  return (
    <div>
      <label htmlFor="d02-query">待提交查询</label>
      <input
        id="d02-query"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!composing.current) schedule(e.target.value)
        }}
        onCompositionStart={() => {
          composing.current = true
          schedule.cancel()
        }}
        onCompositionEnd={(e) => {
          composing.current = false
          schedule.cancel()
          schedule(e.currentTarget.value)
        }}
      />
      <button type="button" onClick={() => schedule.flush()}>
        flush 立即提交
      </button>
      <button type="button" onClick={() => schedule.cancel()}>
        cancel 待执行调用
      </button>
    </div>
  )
}
function DebounceExperiment() {
  const [mounted, setMounted] = useState(true)
  const [events, setEvents] = useState<string[]>([])
  const [observation, setObservation] = useState('尚未检查')
  const eventsRef = useRef(events)
  eventsRef.current = events
  const observerTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const apply = useCallback((value: string) => setEvents((previous) => [...previous, value]), [])
  useEffect(
    () => () => {
      if (observerTimer.current) clearTimeout(observerTimer.current)
    },
    [],
  )
  function unmountAndObserve() {
    const before = eventsRef.current.length
    setMounted(false)
    setObservation('等待 650ms，外层观察器仍挂载')
    if (observerTimer.current) clearTimeout(observerTimer.current)
    observerTimer.current = setTimeout(() => {
      setObservation(
        eventsRef.current.length === before ? '观察完成：卸载后新增 0 次' : '失败：卸载后仍有提交',
      )
    }, 650)
  }
  return (
    <section aria-label="防抖生命周期实验">
      <h2>400ms 防抖与独立观察器</h2>
      <p>
        输入多个字符后等待、flush 或 cancel。IME
        组合期间不调度，结束后才开始等待。先输入新词，再立即卸载；外层事件记录和观察结果会保留。
      </p>
      {mounted ? <SearchInput onApply={apply} /> : <p>输入组件已卸载</p>}
      <button type="button" disabled={!mounted} onClick={unmountAndObserve}>
        卸载输入并观察
      </button>
      <button type="button" disabled={mounted} onClick={() => setMounted(true)}>
        重新挂载输入
      </button>
      <p data-testid="d02-observation" role="status">
        {observation}
      </p>
      <output data-testid="d02-events">{JSON.stringify(events)}</output>
      <p>
        事件记录由外层拥有；debounce 是真实 SDK，观察器和本地数据由本例自建。没有 HTTP；cancel
        不会取消已经发出的请求。
      </p>
    </section>
  )
}
export default function LodashExample({ level }: { level: 'basic' | 'business' | 'advanced' }) {
  return level === 'basic' ? <CollectionExperiment /> : <DebounceExperiment />
}
