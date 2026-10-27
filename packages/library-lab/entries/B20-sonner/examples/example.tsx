import {useEffect, useRef, useState} from 'react';
import {Toaster, toast} from 'sonner';
import {LatestRunGuard} from './latest-run';

type Level = 'basic' | 'business' | 'advanced';
const toasterId = 'reactloom-b20-demo';

export default function SonnerExample({level}: {level: Level}) {
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState('未执行');
  const [failure, setFailure] = useState(false);
  const owned = useRef<Set<string | number>>(new Set());
  const timers = useRef<Set<number>>(new Set());
  const latestRun = useRef(new LatestRunGuard());
  const runningToast = useRef<string | number | null>(null);
  const saveOwner = useRef(new LatestRunGuard());
  const savedToast = useRef<string | number | null>(null);

  useEffect(() => () => {
    latestRun.current.invalidate();
    saveOwner.current.invalidate();
    savedToast.current = null;
    clearPending();
    // Only dismiss toasts owned by this demo; never call toast.dismiss() without an id.
    for (const id of owned.current) toast.dismiss(id);
    owned.current.clear();
  }, [level]);

  function clearPending() {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current.clear();
    if (runningToast.current !== null) {
      toast.dismiss(runningToast.current);
      owned.current.delete(runningToast.current);
      runningToast.current = null;
    }
  }

  function remember(id: string | number) {
    owned.current.add(id);
  }
  function notifyBasic() {
    remember(toast('已订阅：前端工程', {
      toasterId,
      description: '操作成功，短通知不会阻断后续工作。',
    }));
    setResult('已触发基本通知');
  }
  function saveNews() {
    // Only the latest save owns the undo action. An old toast may outlive a new save.
    const token = saveOwner.current.start();
    if (savedToast.current !== null) {
      toast.dismiss(savedToast.current);
      owned.current.delete(savedToast.current);
    }
    setSaved(true);
    setResult('新闻已加入稍后阅读');
    const id = toast.success('已加入稍后阅读', {
      toasterId,
      description: '仅最新一次保存可以撤销，业务状态持续可见。',
      action: {label: '撤销', onClick: () => {
        if (!saveOwner.current.isCurrent(token)) return;
        saveOwner.current.invalidate();
        savedToast.current = null;
        setSaved(false);
        setResult('已撤销最近一次保存');
      }},
    });
    savedToast.current = id;
    remember(id);
  }
  function simulateTask() {
    // A second click supersedes the first, including any pending toast and callback.
    const token = latestRun.current.start();
    clearPending();
    const shouldFail = failure; // Keep business input frozen for this run.
    const id = toast.loading('正在处理本地演示任务…', {toasterId, duration: Infinity});
    remember(id);
    runningToast.current = id;
    setResult('任务进行中');
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      if (!latestRun.current.isCurrent(token)) return;
      runningToast.current = null;
      if (shouldFail) {
        toast.error('处理失败，请稍后重试', {id, toasterId, description: '只是可控的演示失败，不是后端错误。'});
        setResult('任务失败');
      } else {
        toast.success('任务处理完成', {id, toasterId, description: '通过相同 toast id 更新而非堆叠。'});
        setResult('任务成功');
      }
    }, 900);
    timers.current.add(timer);
  }
  function cancelOwn() {
    latestRun.current.invalidate();
    saveOwner.current.invalidate();
    savedToast.current = null;
    clearPending();
    for (const id of owned.current) toast.dismiss(id);
    owned.current.clear();
    setResult('已停止并清理此演示通知');
  }

  return <section aria-label="Sonner 通知真实示例">
    <Toaster id={toasterId} position="bottom-right" theme="light" richColors closeButton duration={3500} visibleToasts={3}/>
    <h2>{level === 'basic' ? '反馈最小实现' : level === 'business' ? '可撤销的业务确认' : '异步状态与取消清理'}</h2>
    <p>通知由真实 Sonner 渲染；业务数据是本地演示，不发起外部请求。</p>
    {level === 'basic' && <button type="button" onClick={notifyBasic}>触发订阅成功提示</button>}
    {level === 'business' && <>
      <button type="button" onClick={saveNews}>保存新闻并显示撤销</button>
      <p>稍后阅读状态：<strong>{saved ? '已保存' : '未保存'}</strong></p>
    </>}
    {level === 'advanced' && <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
      <label><input type="checkbox" checked={failure} onChange={event => setFailure(event.target.checked)}/>模拟业务失败</label>
      <button type="button" onClick={simulateTask}>运行异步反馈</button>
      <button type="button" onClick={cancelOwn}>取消并清理本演示</button>
    </div>}
    <p role="status" style={{marginTop: 18}}>业务状态：{result}</p>
    <p style={{fontSize: 12}}>重复运行采用最后一次有效任务；取消或离开此 Tab 会失效旧回调、清理本 Demo 的计时器和通知，不影响页面其他示例。</p>
  </section>;
}
