import { useCallback, useEffect, useRef, useState } from 'react';
import { useRive } from '@rive-app/react-webgl2';
import { RIVE_SAMPLE_URL, RIVE_SAMPLE_STATE_MACHINE } from './asset';
import './styles.css';

type Level = 'basic' | 'business' | 'advanced';
type Review = 'idle' | 'pending' | 'success' | 'error';

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function usePageVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('已取消', 'AbortError')); return; }
    const timer = window.setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    function abort() {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      reject(new DOMException('已取消', 'AbortError'));
    }
    signal.addEventListener('abort', abort, { once: true });
  });
}

/** Owns exactly one Rive canvas; unmounting this child releases the SDK instance. */
function RivePlayer({ playing, onError }: { playing: boolean; onError: (message: string) => void }) {
  const { rive, RiveComponent } = useRive({
    src: RIVE_SAMPLE_URL,
    stateMachine: RIVE_SAMPLE_STATE_MACHINE,
    autoplay: false,
    onLoadError: error => onError('Rive 资源/渲染失败：' + String(error)),
  }, { useOffscreenRenderer: true });

  useEffect(() => {
    if (!rive) return;
    if (playing) rive.play();
    else rive.pause();
  }, [rive, playing]);

  return <div className="ab-rive-canvas" aria-hidden="true"><RiveComponent /></div>;
}

export default function RiveWorkshop({ level }: { level: Level }) {
  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();
  const [inView, setInView] = useState(level !== 'advanced');
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [phase, setPhase] = useState<Review>('idle');
  const [message, setMessage] = useState('动画资源采用官方公开文档的 CDN 地址，当前运行需要网络。');
  const [simulateError, setSimulateError] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<AbortController | null>(null);
  const generation = useRef(0);

  useEffect(() => {
    if (level !== 'advanced') return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const observer = new IntersectionObserver(entries => {
      setInView(Boolean(entries[0]?.isIntersecting));
    }, { threshold: 0.05 });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [level]);

  useEffect(() => () => {
    ++generation.current;
    pendingRef.current?.abort();
  }, []);

  const cancelReview = useCallback(() => {
    ++generation.current;
    pendingRef.current?.abort();
    pendingRef.current = null;
    setPhase('idle');
    setMessage('取消审核，先前任务不得回写当前页面。');
  }, []);

  const runReview = useCallback(async () => {
    pendingRef.current?.abort();
    const controller = new AbortController();
    pendingRef.current = controller;
    const id = ++generation.current;
    setPhase('pending');
    setMessage('正在执行本地可取消的审核模拟，不会访问真实接口。');
    try {
      await wait(450, controller.signal);
      if (generation.current !== id || controller.signal.aborted) return;
      if (simulateError) throw new Error('模拟 HTTP 503 服务暂不可用');
      setPhase('success');
      setMessage('审核成功：真实业务状态以 HTML 呈现，Rive 不决定任务是否成功。');
    } catch (error) {
      if (generation.current !== id || controller.signal.aborted) return;
      setPhase('error');
      setMessage('审核失败：' + String(error));
    } finally {
      if (generation.current === id) pendingRef.current = null;
    }
  }, [simulateError]);

  const playing = pageVisible && !reduced && !manuallyPaused &&
    (level === 'business' ? phase === 'pending' : true);
  const shouldMount = level !== 'advanced' || inView;

  return <section className="ab-rive" aria-label="Rive 动画与状态机制实验">
    <h2>{level === 'basic' ? '入门：Rive 播放器' : level === 'business' ? '业务：审核状态驱动动画' : '进阶：视口与资源生命周期'}</h2>
    <p>真正调用 Rive React WebGL2 运行时，而不是 CSS/SVG 动画。原始 .riv 动画为 Rive 官方文档引用的远程样本，资源本身不包含在此仓库。</p>
    <div className="ab-rive-actions" role="group" aria-label="动画操作">
      {level === 'business' && <>
        <button type="button" onClick={() => void runReview()}>启动 / 重试审核</button>
        <button type="button" disabled={phase !== 'pending'} onClick={cancelReview}>取消任务</button>
        <label><input type="checkbox" checked={simulateError} onChange={event => setSimulateError(event.target.checked)} />下次模拟 503</label>
      </>}
      <button type="button" onClick={() => setManuallyPaused(value => !value)}>
        {manuallyPaused ? '恢复自动播放' : '手动暂停动画'}
      </button>
    </div>
    <p role="status" aria-live="polite">{level === 'business' ? ('业务状态：' + phase + ' · ') : ''}{message}</p>
    <div ref={wrapperRef} className="ab-rive-viewport">
      {shouldMount
        ? <RivePlayer playing={playing} onError={setMessage} />
        : <div className="ab-rive-placeholder">动画在视口外：Rive 组件已卸载；返回视口后再加载。</div>}
    </div>
    <dl className="ab-rive-facts">
      <div><dt>文档页面</dt><dd>{pageVisible ? '前台' : '后台'}</dd></div>
      <div><dt>系统减少动态效果</dt><dd>{reduced ? '开启（停播）' : '关闭'}</dd></div>
      <div><dt>播放器状态</dt><dd>{!shouldMount ? '未挂载' : playing ? '播放' : '暂停'}</dd></div>
    </dl>
    <p>动画只是视觉装饰，审核成功/失败必须由 HTML 文本、按钮状态和真实业务契约表达。WebGL2 与 CDN 失败时仍保留文本结果。</p>
  </section>;
}
