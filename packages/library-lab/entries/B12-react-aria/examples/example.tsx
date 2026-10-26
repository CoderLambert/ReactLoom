import {useEffect, useMemo, useRef, useState, type FormEvent} from 'react';
import {
  Button, ComboBox, Input, Label, ListBox, ListBoxItem,
  Popover, Text,
} from 'react-aria-components';
import './combobox.css';

type Level = 'basic' | 'business' | 'advanced';
type Channel = {id: string; name: string; category: string; disabled?: boolean};
const CHANNELS: Channel[] = [
  {id: 'react', name: 'React 组件工程', category: '技术'},
  {id: 'backend', name: '后端架构实践', category: '技术'},
  {id: 'opensource', name: '开源趋势', category: '技术'},
  {id: 'global', name: '国际新闻', category: '资讯'},
  {id: 'startup', name: '创业与产品', category: '商业'},
  {id: 'security', name: '安全紧急通告', category: '技术', disabled: true},
  {id: 'reading', name: '深度阅读', category: '个人'},
];

export default function ReactAriaExample({level}: {level: Level}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [resolved, setResolved] = useState<Channel[]>(CHANNELS);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('尚未选择频道');
  const generation = useRef(0);
  const stableItems = useMemo(
    () => level === 'basic' ? CHANNELS.slice(0, 4) : CHANNELS,
    [level],
  );
  const items = level === 'advanced' ? resolved : stableItems;

  // This delayed search is explicitly a LOCAL fixture, not an API integration.
  useEffect(() => {
    if (level !== 'advanced') {
      setResolved(CHANNELS);
      setBusy(false);
      return;
    }
    const id = ++generation.current;
    const controller = new AbortController();
    setBusy(true);
    const timer = setTimeout(() => {
      if (controller.signal.aborted || generation.current !== id) return;
      const query = inputValue.trim().toLocaleLowerCase('zh-CN');
      setResolved(CHANNELS.filter(item =>
        (item.name + ' ' + item.category).toLocaleLowerCase('zh-CN').includes(query)));
      setBusy(false);
    }, 240);
    return () => {
      clearTimeout(timer);
      controller.abort();
      generation.current++;
    };
  }, [inputValue, level]);

  useEffect(() => {
    setSelectedKey(null);
    setInputValue('');
    setMessage('尚未选择频道');
  }, [level]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('channel');
    setMessage(value ? '真实表单选中频道 ID：' + String(value) : '请先选择一个频道');
  }

  return <section aria-label="React Aria Components 可访问组合框实战" className="rl-aria-lab">
    <h2>{level === 'basic' ? 'ComboBox 键盘选择' :
      level === 'business' ? 'RSS 频道发现' : '异步建议、防竞态与中文输入法'}</h2>
    <p>真正由 React Aria Components 实现的 ComboBox；提供可访问标签、焦点管理、键盘/IME 和选择 ID。高级查询仅模拟本地耗时。</p>
    <form onSubmit={submit}>
      <ComboBox
        name="channel"
        selectedKey={selectedKey}
        onSelectionChange={key => {
          const value = key === null ? null : String(key);
          setSelectedKey(value);
          setMessage(value ? '已选择：' + (CHANNELS.find(x => x.id === value)?.name ?? value) : '选择已清空');
        }}
        inputValue={inputValue}
        onInputChange={setInputValue}
        defaultFilter={(textValue, query) => textValue.toLocaleLowerCase('zh-CN').includes(query.toLocaleLowerCase('zh-CN'))}
        menuTrigger={level === 'advanced' ? 'focus' : 'input'}
      >
        <Label>选择 RSS 频道</Label>
        <div className="rl-aria-group">
          <Input placeholder="输入 React、开源、资讯…" aria-describedby="react-aria-lab-hint"/>
          <Button aria-label="显示可选频道">▾</Button>
        </div>
        <Text slot="description" id="react-aria-lab-hint">
          {level === 'advanced' ? '查询结果异步更新，历史请求不能覆盖新结果。' : '使用方向键导航、Enter 选择、Escape 关闭。'}
        </Text>
        <Popover className="rl-aria-popover" placement="bottom start">
          <ListBox items={items} className="rl-aria-listbox"
            renderEmptyState={() => <p className="rl-aria-empty">暂无匹配频道</p>}>
            {item => <ListBoxItem id={item.id} textValue={item.name}
              isDisabled={item.disabled} className="rl-aria-option">
              <span>{item.name}</span>
              <small>{item.disabled ? '暂不可订阅' : item.category}</small>
            </ListBoxItem>}
          </ListBox>
        </Popover>
      </ComboBox>
      {level === 'advanced' && <p role="status" className="rl-aria-status">{busy ? '正在查询本地数据…' : '查询完成'} · {resolved.length} 条候选</p>}
      <div className="rl-aria-actions">
        <button type="submit" className="rl-aria-submit">提交真实表单</button>
        <button type="button" onClick={() => {setSelectedKey(null);setInputValue('');setMessage('已清空');}}>清空选择</button>
      </div>
    </form>
    <p role="status">{message}</p>
    {level === 'advanced' && <p>快速输入会取消旧的延迟查询；由组件自身处理输入法合成事件，不另写 Enter 键提交逻辑。组件卸载会清理定时器。</p>}
  </section>;
}
