import {useRef, useState} from 'react';
import {takeUndo} from './patch-ownership.mjs';
import {produce, produceWithPatches, applyPatches, enablePatches, type Patch} from 'immer';

enablePatches(); // One-time opt-in required for patch-based examples.

type Level = 'basic' | 'business' | 'advanced';
type Story = {id: string; title: string; read: boolean};
type FeedState = {section: {name: string; stories: Story[]}; revision: number};

export const initialState: FeedState = {
  section: {name: '前端工程', stories: [
    {id: 's1', title: 'React 19 生命周期', read: false},
    {id: 's2', title: '异步任务队列实践', read: false},
  ]}, revision: 1,
};

export function toggleStory(state: FeedState, id: string) {
  return produce(state, draft => {
    const story = draft.section.stories.find(item => item.id === id);
    if (story) story.read = !story.read;
    draft.revision++;
  });
}

export default function ImmerWorkshop({level}: {level: Level}) {
  const [feed, setFeed] = useState<FeedState>(() => structuredClone(initialState));
  const [title, setTitle] = useState('前端工程');
  const [patches, setPatches] = useState<Patch[]>([]);
  const undo = useRef<Patch[] | null>(null);
  const [notice, setNotice] = useState('尚未产生更改');
  const locked = undo.current !== null;

  function rename() {
    if (locked) return;
    setFeed(current => produce(current, draft => {
      draft.section.name = title.trim() || '未命名分类';
      draft.revision++;
    }));
    setNotice('深层更新只复制发生变化的路径，旧值不变');
  }

  function toggle(id: string) {
    if (locked) return;
    setFeed(current => toggleStory(current, id));
    setNotice('已使用真正的 produce 更新状态');
  }

  function optimisticChange() {
    if (undo.current) return;
    const [next, changes, inverse] = produceWithPatches(feed, draft => {
      draft.section.stories.unshift({
        id: 'optimistic-' + draft.revision,
        title: '等待服务端确认的新订阅',
        read: false,
      });
      draft.revision++;
    });
    undo.current = inverse;
    setPatches(changes);
    setFeed(next);
    setNotice('模拟乐观操作：尚未提交外部服务，可回滚');
  }

  function rollback() {
    // React may defer the state updater. Read the inverse BEFORE clearing the ref.
    const inverse = takeUndo(undo);
    if (inverse === null) return;
    // No concurrent writes are allowed between patch creation and rollback in this demo.
    setFeed(current => applyPatches(current, inverse));
    setPatches([]);
    setNotice('逆向 Patch 已恢复执行前状态');
  }

  function accept() {
    undo.current = null;
    setPatches([]);
    setNotice('已在本地确认，无网络提交');
  }

  return <section aria-label="Immer 不可变更新教学">
    <h2>{level === 'basic' ? '深层数据不可变更新' :
      level === 'business' ? 'RSS 已读状态与结构共享' : '乐观变更与 Patch 回滚'}</h2>
    <div className="demo-controls">
      <label>分组名 <input aria-label="分组名" value={title} disabled={locked}
        onChange={event => setTitle(event.target.value)} /></label>
      <button type="button" disabled={locked} onClick={rename}>更新分组</button>
    </div>
    {level !== 'basic' && <ul>{feed.section.stories.map(story => <li key={story.id}>
      <label><input type="checkbox" checked={story.read} disabled={locked}
        onChange={() => toggle(story.id)} /> {story.title}</label>
    </li>)}</ul>}
    {level === 'advanced' && <div className="demo-controls">
      <button type="button" disabled={locked} onClick={optimisticChange}>生成乐观更新</button>
      <button type="button" disabled={!locked} onClick={rollback}>模拟失败并撤销</button>
      <button type="button" disabled={!locked} onClick={accept}>确认本地变更</button>
    </div>}
    <p role="status">{notice}</p>
    <pre data-testid="immer-state">{JSON.stringify(feed, null, 2)}</pre>
    {level === 'advanced' && <><h3>实际 Patch</h3>
      <pre>{JSON.stringify(patches, null, 2)}</pre>
      <p>并发更新发生时，逆向 Patch 不能无条件覆盖新服务器结果；实际产品必须结合版本、序号或乐观更新上下文。</p>
    </>}
  </section>;
}

