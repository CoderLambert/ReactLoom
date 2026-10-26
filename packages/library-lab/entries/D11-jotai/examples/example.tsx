import {useMemo} from 'react';
import {atom, createStore, Provider, useAtom, useAtomValue, useSetAtom} from 'jotai';

type Level = 'basic' | 'business' | 'advanced';
type Story = {id: string; title: string; read: boolean};

export const counterAtom = atom(0);
export const doubleAtom = atom(get => get(counterAtom) * 2);
export const storiesAtom = atom<Story[]>([
  {id: 'rss-1', title: '前端性能监控', read: false},
  {id: 'rss-2', title: '测试场景矩阵', read: false},
]);
export const unreadAtom = atom(get => get(storiesAtom).filter(story => !story.read).length);
export const toggleReadAtom = atom(null, (get, set, id: string) => {
  set(storiesAtom, get(storiesAtom).map(story =>
    story.id === id ? {...story, read: !story.read} : story));
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

export default function JotaiWorkshop({level}: {level: Level}) {
  const leftStore = useMemo(() => createStore(), []);
  const rightStore = useMemo(() => createStore(), []);
  return <section aria-label="Jotai 原子 Store 隔离演示">
    <h2>{level === 'basic' ? '基础 atom 与派生值' :
      level === 'business' ? 'RSS 已读原子与写入 atom' : '多租户独立 Provider/Store'}</h2>
    <p>同一个 atom 配置在不同 Store 中有独立的值；Demo 不使用默认全局 Store。</p>
    <Provider store={leftStore}><WorkspaceAtoms level={level} label="团队 A" /></Provider>
    {level === 'advanced' && <>
      <p>下面是同一组件和同一组 atom 配置，但通过另一 Store 实现真正隔离。</p>
      <Provider store={rightStore}><WorkspaceAtoms level={level} label="团队 B" /></Provider>
    </>}
    <p>Jotai 保存原子化 UI 状态，远端数据缓存仍应交给 TanStack Query 等专门层。</p>
  </section>;
}

