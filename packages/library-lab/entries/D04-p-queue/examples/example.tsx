import {useEffect, useRef, useState} from 'react';
import PQueue from 'p-queue';

type Level = 'basic' | 'business' | 'advanced';
type Status = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';
type Job = {id: number; status: Status; started?: number};
type Active = {controller: AbortController; queue: PQueue};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {reject(signal.reason ?? new DOMException('Aborted', 'AbortError')); return;}
    const timer = window.setTimeout(() => {signal?.removeEventListener('abort', abort); resolve();}, ms);
    function abort() {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    }
    signal?.addEventListener('abort', abort, {once: true});
  });
}

export default function QueueWorkshop({level}: {level: Level}) {
  const [concurrency, setConcurrency] = useState(2);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState('尚未运行');
  const [counts, setCounts] = useState({running: 0, queued: 0, peak: 0});
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const current = useRef<Active | null>(null);
  const generation = useRef(0);

  useEffect(() => () => {
    generation.current++;
    current.current?.controller.abort();
    current.current?.queue.clear();
    current.current?.queue.pause();
    current.current = null;
  }, []);

  function cancel() {
    const active = current.current;
    if (!active) return;
    active.controller.abort(new DOMException('用户取消', 'AbortError'));
    active.queue.clear();
    setSummary('正在取消运行与等待中的任务…');
  }

  async function execute() {
    const controller = new AbortController();
    const queue = new PQueue(level === 'basic' ? {concurrency}
      : {concurrency, interval: 600, intervalCap: 3, strict: true});
    current.current = {queue, controller};
    const token = ++generation.current;
    const count = level === 'basic' ? 7 : 12;
    let running = 0;
    let peak = 0;
    setJobs(Array.from({length: count}, (_, index) => ({id: index + 1, status: 'queued'})));
    setCounts({running: 0, queued: count, peak: 0});
    setSummary('真实 p-queue 正在调度；所有业务工作都是本地延时 fixture');
    setBusy(true);
    setPaused(false);

    function update(id: number, status: Status) {
      if (token !== generation.current) return;
      setJobs(prev => prev.map(item => item.id === id ? {...item, status} : item));
      setCounts({running: queue.pending, queued: queue.size, peak});
    }

    const tasks = Array.from({length: count}, (_, index) => queue.add(async ({signal}) => {
      const id = index + 1;
      running++;
      peak = Math.max(peak, running);
      update(id, 'running');
      try {
        await sleep(160 + (index % 3) * 80, signal ?? controller.signal);
        if (level === 'advanced' && id === 4) throw new Error('fixture：单项业务失败');
        update(id, 'done');
        return id;
      } catch (error) {
        update(id, controller.signal.aborted ? 'cancelled' : 'failed');
        throw error;
      } finally {
        running--;
        if (token === generation.current)
          setCounts({running: queue.pending, queued: queue.size, peak});
      }
    }, {signal: controller.signal, priority: level === 'business' && index === 7 ? 5 : 0}));

    const settled = await Promise.allSettled(tasks);
    if (token !== generation.current) return;
    setJobs(prev => prev.map(item => controller.signal.aborted && item.status === 'queued'
      ? {...item, status: 'cancelled'} : item));
    setCounts({running: queue.pending, queued: queue.size, peak});
    setBusy(false);
    setPaused(false);
    current.current = null;
    const failed = settled.filter(item => item.status === 'rejected').length;
    setSummary(controller.signal.aborted
      ? '取消完成：全部提交的 add() Promise 均已结算，其中 ' + failed + ' 项拒绝'
      : '批处理已结算：' + (count - failed) + ' 成功 / ' + failed + ' 拒绝');
  }

  return <section aria-label="p-queue 实战队列">
    <h2>{level === 'basic' ? '并发槽位与真实任务排队'
      : level === 'business' ? 'RSS 更新：并发 + 严格滑动时间窗'
        : '任务失败、暂停与用户取消'}</h2>
    <p>真实 PQueue 实例调度任务。{level === 'basic' ?
      '并发不会超出设定值。' : '同时最多 N 个，且 600ms 窗口启动不超过3个；不发送外部HTTP。'}</p>
    <div className="demo-controls">
      <label>最大并发 <select value={concurrency} disabled={busy}
        onChange={event => setConcurrency(Number(event.target.value))}>
        {[1,2,3].map(number => <option value={number} key={number}>{number}</option>)}
      </select></label>
      <button type="button" disabled={busy} onClick={() => void execute()}>启动批次</button>
      {level !== 'basic' && <button type="button" disabled={!busy}
        onClick={() => {const queue = current.current?.queue; if (!queue) return;
          if (paused) queue.start(); else queue.pause(); setPaused(!paused);}}>
        {paused ? '恢复排队' : '暂停新任务'}
      </button>}
      <button type="button" disabled={!busy} onClick={cancel}>取消任务</button>
    </div>
    <p role="status">{summary}</p>
    <p>当前运行 {counts.running} · 等待 {counts.queued} · 峰值 {counts.peak}</p>
    <div className="demo-jobs">{jobs.map(job =>
      <div className="demo-job" key={job.id} data-state={job.status}>
        RSS-{job.id}<strong>{job.status}</strong>
      </div>)}</div>
    {level !== 'basic' && <p>暂停不会中止运行中任务；priority 只改变等待队列顺序。真实外部 HTTP 尝试、重试预算和超时还需在任务函数内设计。</p>}
    {level === 'advanced' && <p>第4个任务固定失败，其他项继续结算。abort 会通知运行中任务，clear() 处理等待队列；不能把清队列当作已终止网络 I/O。</p>}
  </section>;
}
