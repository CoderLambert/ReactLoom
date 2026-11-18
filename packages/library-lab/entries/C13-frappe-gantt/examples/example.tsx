import { useEffect, useMemo, useRef, useState } from 'react'
import './gantt.css'
import {
  MAX_PLAN_DATE,
  MAX_PLAN_SPAN_DAYS,
  MIN_PLAN_DATE,
  toChartTasks,
  validatePlan,
} from './plan-policy.mjs'

export { validatePlan, validCivilDate } from './plan-policy.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Task = {
  id: string
  name: string
  start: string
  end: string
  progress: number
  dependencies: string
}
const BASE: Task[] = [
  {
    id: 'research',
    name: '需求评审 <草稿> & 确认',
    start: '2026-10-27',
    end: '2026-10-29',
    progress: 100,
    dependencies: '',
  },
  {
    id: 'frontend',
    name: '前端开发',
    start: '2026-10-30',
    end: '2026-11-04',
    progress: 45,
    dependencies: 'research',
  },
  {
    id: 'qa',
    name: '联调回归',
    start: '2026-11-05',
    end: '2026-11-08',
    progress: 10,
    dependencies: 'frontend',
  },
]
function GanttCanvas({ tasks, view }: { tasks: Task[]; view: 'Day' | 'Week' | 'Month' }) {
  const host = useRef<HTMLDivElement | null>(null)
  const chart = useRef<import('frappe-gantt').default | null>(null)
  const latest = useRef({ tasks, view })
  const applied = useRef({ tasks, view })
  const [error, setError] = useState('')
  useEffect(() => {
    const el = host.current
    if (!el) return
    let alive = true
    el.replaceChildren()
    setError('')
    import('frappe-gantt')
      .then(({ default: Gantt }) => {
        if (!alive) return
        // One constructor per dedicated document. The SDK mutates its copied descriptors.
        const current = latest.current
        const issue = validatePlan(current.tasks)
        if (issue) {
          setError(issue)
          return
        }
        chart.current = new Gantt(el, toChartTasks(current.tasks), {
          view_mode: current.view,
          readonly: true,
          popup: false,
          infinite_padding: false,
          scroll_to: 'start',
        })
        applied.current = current
      })
      .catch((e) => {
        if (alive) setError(String(e))
      })
    // DOM removal alone cannot release upstream's document mouseup closure.
    // The registered runner destroys the entire frame on stop/reset/leave.
    return () => {
      alive = false
      chart.current = null
      el.replaceChildren()
    }
  }, [])
  useEffect(() => {
    const issue = validatePlan(tasks)
    if (issue) {
      setError(issue)
      return
    }
    latest.current = { tasks, view }
    const instance = chart.current
    if (!instance) return
    try {
      if (applied.current.tasks !== tasks) instance.refresh(toChartTasks(tasks))
      if (applied.current.view !== view) instance.change_view_mode(view)
      applied.current = { tasks, view }
      setError('')
    } catch (e) {
      setError(String(e))
    }
  }, [tasks, view])
  return (
    <div className="rl-c13">
      <div
        ref={host}
        className="rl-c13-chart"
        role="img"
        aria-label="任务时间线图，仅作视觉展示；下方的语义表格可使用键盘编辑"
      />
      {error && <p role="alert">甘特图未加载：{error}</p>}
    </div>
  )
}
export default function FrappeGanttExample({ level }: { level: Level }) {
  const [tasks, setTasks] = useState<Task[]>(() => BASE.map((t) => ({ ...t })))
  const [view, setView] = useState<'Day' | 'Week' | 'Month'>('Week')
  const [filter, setFilter] = useState('')
  const [revision, setRevision] = useState(0)
  const [status, setStatus] = useState('内存任务，未连接真实项目服务')
  const shown = useMemo(() => tasks.filter((t) => t.name.includes(filter)), [tasks, filter])
  function save(task: Task, form: FormData) {
    const rawProgress = form.get('progress')
    const next: Task = {
      ...task,
      start: String(form.get('start')),
      end: String(form.get('end')),
      progress:
        typeof rawProgress === 'string' && rawProgress.trim() !== '' ? Number(rawProgress) : NaN,
    }
    const candidate = tasks.map((t) => (t.id === task.id ? next : t))
    const error = validatePlan(candidate)
    if (error) {
      setStatus('已拒绝保存，视图保持不变：' + error)
      return
    }
    if (level === 'advanced' && task.id === 'qa') {
      setStatus('模拟 HTTP 409：联调任务版本冲突，未修改客户端权威数据')
      return
    }
    setTasks(candidate)
    setRevision((value) => value + 1)
    setStatus('已更新当前内存计划：' + task.id)
  }
  function previewCycle() {
    const candidate = tasks.map((task) =>
      task.id === 'research' ? { ...task, dependencies: 'qa' } : task,
    )
    const error = validatePlan(candidate)
    setStatus(error ? '演示依赖环被拒绝：' + error : '当前计划未形成闭环')
  }
  return (
    <section
      className="c13-workshop"
      aria-label="Frappe Gantt 真实示例"
      data-testid="c13-workshop"
      data-level={level}
      data-revision={revision}
    >
      <h2>
        {level === 'basic'
          ? '三项任务与依赖'
          : level === 'business'
            ? '项目任务进度'
            : '无效区间与 409 冲突'}
      </h2>
      <div className="demo-controls">
        <label>
          时间尺度{' '}
          <select value={view} onChange={(e) => setView(e.target.value as typeof view)}>
            <option>Day</option>
            <option>Week</option>
            <option>Month</option>
          </select>
        </label>
        {level !== 'basic' && (
          <label>
            过滤表格任务 <input value={filter} onChange={(e) => setFilter(e.target.value)} />
          </label>
        )}
        {level === 'advanced' && (
          <button type="button" onClick={previewCycle}>
            模拟依赖闭环（不保存）
          </button>
        )}
      </div>
      <p role="status" data-testid="c13-status">
        {status}
      </p>
      <p>
        表格输入是未保存草稿；只有整份校验通过并获本地接受后才改变权威计划。拒绝或模拟409时草稿保留，图表和下方快照保持原值。
      </p>
      <GanttCanvas tasks={tasks} view={view} />
      <h3>等效键盘可编辑任务列表</h3>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th scope="col">任务</th>
              <th scope="col">依赖</th>
              <th scope="col">日期/进度</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((task) => (
              <tr key={task.id}>
                <td>{task.name}</td>
                <td>{task.dependencies || '—'}</td>
                <td>
                  {level === 'basic' ? (
                    task.start + ' → ' + task.end
                  ) : (
                    <form
                      noValidate
                      key={task.id + task.start + task.end + task.progress}
                      onSubmit={(e) => {
                        e.preventDefault()
                        save(task, new FormData(e.currentTarget))
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' &&
                          e.target instanceof HTMLInputElement &&
                          !e.nativeEvent.isComposing
                        ) {
                          e.preventDefault()
                          save(task, new FormData(e.currentTarget))
                        }
                      }}
                      className="demo-controls"
                    >
                      <label>
                        开始{' '}
                        <input
                          aria-label={task.name + '开始日期'}
                          type="date"
                          name="start"
                          min={MIN_PLAN_DATE}
                          max={MAX_PLAN_DATE}
                          defaultValue={task.start}
                          required
                        />
                      </label>
                      <label>
                        结束{' '}
                        <input
                          aria-label={task.name + '结束日期'}
                          type="date"
                          name="end"
                          min={MIN_PLAN_DATE}
                          max={MAX_PLAN_DATE}
                          defaultValue={task.end}
                          required
                        />
                      </label>
                      <label>
                        进度{' '}
                        <input
                          aria-label={task.name + '进度'}
                          type="number"
                          name="progress"
                          min={0}
                          max={100}
                          defaultValue={task.progress}
                          required
                        />
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          const form = e.currentTarget.form
                          if (form) save(task, new FormData(form))
                        }}
                      >
                        保存
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details open>
        <summary>当前权威计划（未保存草稿不进入此处）</summary>
        <pre data-testid="c13-plan">{JSON.stringify(tasks, null, 2)}</pre>
      </details>
      <p>
        演示日期范围 {MIN_PLAN_DATE} 至 {MAX_PLAN_DATE}
        ，为SDK的Day/Week/Month轴留白预留边界；已关闭无限轴扩展。任务名称在图表副本中转义，权威数据与语义表格仍为原始文本。
      </p>
      <p>
        甘特图只负责可视化，日期更改由语义表格完成。筛选只作用于表格，不能将缺少依赖的子集交给甘特引擎。演示计划最早开始至最晚结束最多相隔{' '}
        {MAX_PLAN_SPAN_DAYS} 个 UTC 日，超限拒绝保存。
      </p>
      {level === 'advanced' && (
        <p>
          将结束日改为早于开始日触发拒绝；保存“联调回归”模拟
          409。本地依赖闭环/非有限进度已校验；跨时区与服务端 revision 仍需要独立契约测试。
        </p>
      )}
    </section>
  )
}
