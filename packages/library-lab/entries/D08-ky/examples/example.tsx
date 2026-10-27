import {useEffect, useMemo, useRef, useState} from 'react';
import ky, {isHTTPError, isResponseSizeError} from 'ky';

type Level = 'basic' | 'business' | 'advanced';
type Source = {id: string; title: string; url: string};
const sources: Source[] = [
  {id: 'frontend', title: 'React 工程', url: 'https://react.dev/blog'},
  {id: 'security', title: '安全实践', url: 'https://web.dev/'},
  {id: 'rss', title: 'RSS 标准', url: 'https://www.rssboard.org/'},
];

function validateSources(value: unknown): Source[] {
  if (!Array.isArray(value) || value.length > 30) throw new Error('响应不是允许的来源列表');
  return value.map(item => {
    if (!item || typeof item !== 'object') throw new Error('来源字段缺失');
    const source = item as Record<string, unknown>;
    if (typeof source.id !== 'string' || typeof source.title !== 'string' ||
      typeof source.url !== 'string')
      throw new Error('来源数据不合法');
    let parsed: URL;
    try {parsed = new URL(source.url);} catch {throw new Error('来源URL无效');}
    if (parsed.protocol !== 'https:' || !parsed.hostname) throw new Error('只能使用HTTPS来源');
    return {id: source.id, title: source.title, url: parsed.href};
  });
}

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {reject(signal.reason ?? new DOMException('Aborted', 'AbortError')); return;}
    const timer = window.setTimeout(() => {signal.removeEventListener('abort', abort); resolve();}, ms);
    function abort() {window.clearTimeout(timer); signal.removeEventListener('abort', abort);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));}
    signal.addEventListener('abort', abort, {once: true});
  });
}

// 不调用真实网络：Ky 自己完成 Request、Response、HTTP 错误、retry 与取消逻辑。
// 仅自有 .invalid 域名可以进入 fixture，未知路径全部拒绝。
function createFixtureTransport() {
  const attempts = new Map<string, number>();
  const mockFetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.origin !== 'https://lab.invalid') throw new Error('fixture 拒绝外部网络请求');
    const key = request.method + ':' + url.pathname;
    const next = (attempts.get(key) ?? 0) + 1;
    attempts.set(key, next);
    if (url.pathname === '/sources' && request.method === 'GET') {
      const query = url.searchParams.get('q') ?? '';
      await pause(query === 'slow' ? 460 : 45, request.signal);
      return Response.json(sources.filter(source =>
        (source.title + source.id).toLowerCase().includes(query === 'fast' || query === 'slow' ? '' : query.toLowerCase())));
    }
    if (url.pathname === '/transient' && request.method === 'GET') {
      return next === 1 ? new Response('暂时不可用', {status: 503})
        : Response.json({ok: true, attempts: next});
    }
    if (url.pathname === '/follow' && request.method === 'POST')
      return Response.json({code: 'STALE_VERSION', message: '请刷新服务端版本'}, {status: 409});
    if (url.pathname === '/huge' && request.method === 'GET')
      return new Response('x'.repeat(1024), {headers: {'content-type': 'text/plain'}});
    if (url.pathname === '/removed' && request.method === 'DELETE')
      return new Response(null, {status: 204});
    return Response.json({message: 'not found'}, {status: 404});
  };
  return {fetch: mockFetch, attempts, resetTransient: () => attempts.delete('GET:/transient')};
}

function describeError(error: unknown): string {
  if (isHTTPError(error)) return 'HTTP ' + error.response.status + '：应用层需处理失败，不展示私密请求数据';
  if (isResponseSizeError(error)) return '响应体超出限制，停止解析';
  if (error instanceof Error && error.name === 'AbortError') return '已取消旧请求';
  return '请求失败：' + (error instanceof Error ? error.message : '未知错误');
}

export default function KyWorkshop({level}: {level: Level}) {
  const fixture = useMemo(createFixtureTransport, []);
  const client = useMemo(() => ky.create({
    fetch: fixture.fetch, timeout: 1200, totalTimeout: 2500,
    retry: {limit: 1, methods: ['get'], statusCodes: [503], backoffLimit: 400},
  }), [fixture]);
  const [draft, setDraft] = useState('');
  const composing = useRef(false);
  const [data, setData] = useState<Source[]>([]);
  const [state, setState] = useState('本地网络 fixture 待执行；不会发出真实 HTTP');
  const [advancedResult, setAdvancedResult] = useState('');
  const generation = useRef(0);
  const current = useRef<AbortController | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    generation.current++;
    current.current?.abort();
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  async function search(query: string) {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    const ticket = ++generation.current;
    setState('正在获取 ' + (query || '全部') + ' …');
    try {
      const raw = await client.get('https://lab.invalid/sources',
        {searchParams: {q: query}, signal: controller.signal}).json<unknown>();
      const parsed = validateSources(raw);
      if (ticket !== generation.current || controller.signal.aborted) return;
      setData(parsed);
      setState('只接受最新第 ' + ticket + ' 次查询结果：' + parsed.length + ' 条');
    } catch (error) {
      if (ticket === generation.current) setState(describeError(error));
    }
  }

  async function advanced(kind: 'retry' | 'conflict' | 'huge' | 'empty') {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    const ticket = ++generation.current;
    setAdvancedResult('正在执行真实 Ky 请求处理…');
    try {
      let result: string;
      if (kind === 'retry') {
        // Each click must demonstrate a NEW first-attempt 503, not reuse last click's success.
        fixture.resetTransient();
        const payload = await client.get('https://lab.invalid/transient',
          {signal: controller.signal}).json<{ok: boolean; attempts: number}>();
        result = '503 后最终成功，实际请求次数：' + payload.attempts;
      } else if (kind === 'conflict') {
        await client.post('https://lab.invalid/follow',
          {json: {id: 'frontend', version: 1}, retry: {limit: 0}, signal: controller.signal});
        result = '意外成功';
      } else if (kind === 'huge') {
        await client.get('https://lab.invalid/huge',
          {maxResponseSize: 100, retry: {limit: 0}, signal: controller.signal}).text();
        result = '响应尺寸限制未触发（需要核对目标版本）';
      } else {
        const response = await client.delete('https://lab.invalid/removed', {retry: {limit: 0}, signal: controller.signal});
        result = 'DELETE ' + response.status + '：204 不应调用 json()';
      }
      if (ticket === generation.current) setAdvancedResult(result);
    } catch (error) {
      if (ticket === generation.current) setAdvancedResult(describeError(error));
    }
  }

  return <section aria-label="Ky HTTP 客户端演示">
    <h2>{level === 'basic' ? '原生 Fetch 之上的 HTTP 客户端'
      : level === 'business' ? 'RSS 搜索：取消与结果版本'
        : '503/409/响应体上限/204 协议边界'}</h2>
    <p>调用真实 ky@2.2 的请求、重试与超时实现；fetch 传入严格限定的本地虚构 Response 适配器，绝不连接外网。</p>
    {level !== 'advanced' ? <>
      {level === 'business' && <form className="demo-controls" onSubmit={event => {
        event.preventDefault(); if (!composing.current) void search(draft.trim());}}>
        <label>来源关键词 <input aria-label="来源关键词" value={draft} onChange={event => setDraft(event.target.value)}
          onCompositionStart={() => {composing.current = true;}}
          onCompositionEnd={() => {composing.current = false;}} /></label>
        <button type="submit">搜索来源</button>
      </form>}
      <div className="demo-controls">
        <button type="button" onClick={() => void search('')}>GET 来源列表</button>
        {level === 'business' && <button type="button" onClick={() => {
          void search('slow');
          if (timer.current !== null) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => void search('fast'), 45);
        }}>模拟先慢后快的搜索</button>}
        <button type="button" onClick={() => current.current?.abort()}>取消当前请求</button>
      </div>
      <p role="status">{state}</p>
      <ul>{data.map(item => <li key={item.id}>{item.title} / {item.url}</li>)}</ul>
    </> : <>
      <div className="demo-controls">
        <button type="button" onClick={() => void advanced('retry')}>GET 503 → 有限重试</button>
        <button type="button" onClick={() => void advanced('conflict')}>POST 409 → 不重试</button>
        <button type="button" onClick={() => void advanced('huge')}>响应体 1 KiB → 100 B 上限</button>
        <button type="button" onClick={() => void advanced('empty')}>DELETE 204 空正文</button>
      </div>
      <p role="status">{advancedResult}</p>
      <p>v2 使用 prefix 而非旧 prefixUrl；HTTPError.data 已读取错误正文，不能再次使用 response.json()。这里不输出请求凭据。</p>
    </>}
  </section>;
}
