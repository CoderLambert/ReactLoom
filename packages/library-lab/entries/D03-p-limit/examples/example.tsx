import {useEffect, useRef, useState} from 'react';
import pLimit from 'p-limit';

type Props = {level: 'basic' | 'business' | 'advanced'};
type JobState = 'queued' | 'running' | 'done' | 'error' | 'cancelled';
type Job = {id: number; state: JobState};
type Batch = {controller: AbortController; clearQueue: () => void};

function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {reject(new DOMException('已取消', 'AbortError')); return;}
    const finish = () => {
      signal.removeEventListener('abort', cancel);
      resolve();
    };
    const timer = window.setTimeout(finish, ms);
    const cancel = () => {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      reject(new DOMException('已取消', 'AbortError'));
    };
    signal.addEventListener('abort', cancel, {once: true});
  });
}

export default function ConcurrencyExample({level}: Props) {
  const [concurrency, setConcurrency] = useState(2);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [running, setRunning] = useState(false);
  const [counts, setCounts] = useState({active: 0, pending: 0});
  const [status, setStatus] = useState('尚未运行');
  const generation = useRef(0);
  const current = useRef<Batch | null>(null);

  useEffect(() => () => {
    generation.current++;
    current.current?.controller.abort();
    current.current?.clearQueue();
    current.current = null;
  }, []);

  function cancel() {
    if (!current.current) return;
    // 先中止正在运行的任务，再让队列上未开始的 Promise 以 AbortError 结算。
    current.current.controller.abort();
    current.current.clearQueue();
    setJobs(old => old.map(job =>
      job.state === 'running' || job.state === 'queued'
        ? {...job, state: 'cancelled'} : job));
    setStatus('正在取消批次…');
  }

  async function run() {
    current.current?.controller.abort();
    current.current?.clearQueue();
    const token = ++generation.current;
    const controller = new AbortController();
    // p-limit v7.3.3：rejectOnClear=true 保证 clearQueue 不留下永不结算的 Promise。
    const limit = pLimit({concurrency, rejectOnClear: true});
    current.current = {controller, clearQueue: () => limit.clearQueue()};
    const total = level === 'basic' ? 6 : 10;
    setJobs(Array.from({length: total}, (_, index) => ({id: index + 1, state: 'queued'})));
    setRunning(true);
    setCounts({active: 0, pending: total});
    setStatus('正在执行真实 p-limit 批次');

    function update(id: number, state: JobState) {
      if (token !== generation.current) return;
      setJobs(old => old.map(job => job.id === id ? {...job, state} : job));
      setCounts({active: limit.activeCount, pending: limit.pendingCount});
    }

    const tasks = Array.from({length: total}, (_, index) => limit(async () => {
      const jobId = index + 1;
      if (controller.signal.aborted) {update(jobId, 'cancelled'); return;}
      update(jobId, 'running');
      try {
        // 只有本地延迟，不发出真实 HTTP/API 请求。
        await pause(220 + index % 3 * 110, controller.signal);
        if (controller.signal.aborted) {update(jobId, 'cancelled'); return;}
        if (level === 'advanced' && jobId === 4) {
          throw new Error('本地 fixture：任务 4 失败');
        }
        update(jobId, 'done');
      } catch (error) {
        if (controller.signal.aborted) {update(jobId, 'cancelled'); return;}
        update(jobId, 'error');
        throw error;
      }
    }));

    const outcomes = await Promise.allSettled(tasks);
    if (token !== generation.current) return;
    // 被 clearQueue 拒绝的任务尚未运行，需在 UI 中补齐 cancelled 标记。
    if (controller.signal.aborted) {
      setJobs(old => old.map(job => job.state === 'queued' || job.state === 'running'
        ? {...job, state: 'cancelled'} : job));
    }
    setCounts({active: limit.activeCount, pending: limit.pendingCount});
    setRunning(false);
    setStatus(controller.signal.aborted
      ? '已取消：运行中任务中断，排队任务被拒绝并结算'
      : '执行结束：' + outcomes.filter(outcome => outcome.status === 'rejected').length +
        ' 个失败，其他任务继续完成');
    current.current = null;
  }

  return <section aria-label="p-limit 真实并发调度">
    <h2>{level === 'basic' ? '同时最多 N 个任务'
      : level === 'business' ? '新闻摘要批处理' : '取消与失败隔离'}</h2>
    <p>真实 p-limit 负责调度，工作负载为本地延时 fixture；没有外部网络或收费请求。</p>
    <div className="demo-controls">
      <label>并发数 <select value={concurrency} disabled={running}
        onChange={event => setConcurrency(Number(event.target.value))}>
        {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
      </select></label>
      <button type="button" disabled={running} onClick={() => void run()}>运行批处理</button>
      <button type="button" disabled={!running} onClick={cancel}>取消任务</button>
    </div>
    <p role="status">{status}</p>
    <p>正在运行 {counts.active} / 等待 {counts.pending}</p>
    <div className="demo-jobs">{jobs.map(job =>
      <div key={job.id} className="demo-job" data-state={job.state}>
        任务 {job.id}<strong>{job.state}</strong>
      </div>)}</div>
    <p>并发上限 ≠ 每秒速率。运行中任务通过 AbortSignal 终止；
      未启动队列通过 rejectOnClear=true + clearQueue 拒绝。</p>
  </section>;
}
