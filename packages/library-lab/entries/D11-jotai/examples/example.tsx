import {useMemo, useState} from 'react';
import {toggleStoryRead} from './story-policy.mjs';
import {atom, createStore, Provider, useAtom, useAtomValue, useSetAtom} from 'jotai';

type Level = 'basic' | 'business' | 'advanced';
type Story = {id: string; title: string; read: boolean};

export const counterAtom = atom(0);
export const doubleAtom = atom(get => get(counterAtom) * 2);
export const storiesAtom = atom<readonly Story[]>([
  {id: 'rss-1', title: '前端性能监控', read: false},
  {id: 'rss-2', title: '测试场景矩阵', read: false},
]);
export const unreadAtom = atom(get => get(storiesAtom).filter(story => !story.read).length);
export const toggleReadAtom = atom(null, (get, set, id: string) => {
  set(storiesAtom, toggleStoryRead(get(storiesAtom), id));
});

function WorkspaceAtoms({level, label}: {level: Level; label: string}) {
  const [counter, setCounter] = useAtom(counterAtom);
  const doubled = useAtomValue(doubleAtom);
  const stories = useAtomValue(storiesAtom);
  const unread = useAtomValue(unreadAtom);
  const toggleRead = useSetAtom(toggleReadAtom);

  return <article className="demo-card" aria-label={label + '原子状态'}>
    <h3>{label}</h3>
    <div className="demo-controls">
      <button type="button" onClick={() => setCounter(value => value + 1)}>
        当前计数 +1
      </button>
      <button type="button" onClick={() => setCounter(0)}>只重置此 Store 的计数</button>
    </div>
    <p data-testid={'jotai-count-' + label}>count = {counter}，derived double = {doubled}</p>
    {level !== 'basic' && <>
      <p>未读：{unread} / {stories.length}</p>
      <ul>{stories.map(story => <li key={story.id}>
        <label><input type="checkbox" checked={story.read}
          onChange={() => toggleRead(story.id)} /> {story.title}</label>
      </li>)}</ul>
    </>}
  </article>;
}

function TenantWorkspace({level, label}: {level: Level; label: string}) {
  // Each keyed mount owns one Store; unmount releases its local state subscriptions.
  const store = useMemo(() => createStore(), []);
  return <Provider store={store}><WorkspaceAtoms level={level} label={label} /></Provider>;
}

export default function JotaiWorkshop({level}: {level: Level}) {
  const [teamASession, setTeamASession] = useState(0);
  return <section aria-label="Jotai 原子 Store 隔离演示">
    <h2>{level === 'basic' ? '基础 atom 与派生值' :
      level === 'business' ? 'RSS 已读原子与写入 atom' : '多租户独立 Provider/Store'}</h2>
    <p>同一组 atom 配置在不同 Store 中有独立的值。更换团队 A 的会话会卸载旧 Provider，防止旧会话状态残留。</p>
    {level === 'advanced' && <button type="button" onClick={() => setTeamASession(current => current + 1)}>
      退出并新建团队 A 会话
    </button>}
    <TenantWorkspace key={'team-A-session-' + teamASession} level={level} label="团队 A" />
    {level === 'advanced' && <>
      <p>团队 B 的 Store 由独立组件持有：更换 A 的会话不会重置 B；退出高级模式会卸载 B。</p>
      <TenantWorkspace key="team-B-session" level={level} label="团队 B" />
    </>}
    <p>UI atom 不承担服务端缓存或授权；实际租户切换必须同步清除/隔离远端缓存与请求。</p>
  </section>;
}
