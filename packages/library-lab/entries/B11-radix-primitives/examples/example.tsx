import {useState} from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import './dropdown.css';

type Level = 'basic' | 'business' | 'advanced';
type Sort = 'new' | 'popular';

export default function RadixPrimitivesExample({level}: {level: Level}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [sort, setSort] = useState<Sort>('new');
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState('尚未执行任何操作');
  const [selectedFeed, setSelectedFeed] = useState('浏览器工程');
  function report(action: string) {setMessage(action);}
  return <section aria-label="Radix DropdownMenu 真实交互示例" className="rl-radix-lab">
    <h2>{level === 'basic' ? '无样式下拉菜单' : level === 'business' ?
      'RSS 订阅操作与排序' : '禁用权限、子菜单与键盘焦点'}</h2>
    <p>真实 Radix Primitives 管焦点、键盘、typeahead、ARIA；Lab 只提供局部 CSS 与原创业务状态。</p>
    {level === 'advanced' && <label className="rl-radix-switch">
      <input type="checkbox" checked={locked} onChange={e => setLocked(e.target.checked)}/>
      锁定删除权限
    </label>}
    <div className="rl-radix-workspace">
      <p><strong>订阅：</strong>{selectedFeed}</p>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button type="button" className="rl-radix-trigger">更多操作 ▾</button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="start" sideOffset={8}
            className="rl-radix-menu" aria-label="订阅操作">
            <DropdownMenu.Label className="rl-radix-label">对“{selectedFeed}”执行</DropdownMenu.Label>
            <DropdownMenu.Item className="rl-radix-item" onSelect={() => report('已在本地模拟打开订阅详情')}>
              查看详情 <span className="rl-radix-shortcut">Enter</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item className="rl-radix-item"
              onSelect={() => {setSelectedFeed('工程精选（本地更名）');report('名称已在本地变更');}}>
              重命名（本地）
            </DropdownMenu.Item>
            {level !== 'basic' && <>
              <DropdownMenu.Separator className="rl-radix-separator"/>
              <DropdownMenu.CheckboxItem className="rl-radix-item"
                checked={pinned} onCheckedChange={value => {setPinned(value === true);report(value === true ? '已置顶' : '已取消置顶');}}
                onSelect={event => event.preventDefault()}>
                <DropdownMenu.ItemIndicator className="rl-radix-indicator">✓</DropdownMenu.ItemIndicator>
                收藏置顶
              </DropdownMenu.CheckboxItem>
              <DropdownMenu.Label className="rl-radix-label">排序方式</DropdownMenu.Label>
              <DropdownMenu.RadioGroup value={sort}
                onValueChange={value => setSort(value === 'popular' ? 'popular' : 'new')}>
                <DropdownMenu.RadioItem value="new" className="rl-radix-item">
                  <DropdownMenu.ItemIndicator className="rl-radix-indicator">●</DropdownMenu.ItemIndicator>最新优先
                </DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="popular" className="rl-radix-item">
                  <DropdownMenu.ItemIndicator className="rl-radix-indicator">●</DropdownMenu.ItemIndicator>热度优先
                </DropdownMenu.RadioItem>
              </DropdownMenu.RadioGroup>
            </>}
            {level === 'advanced' && <>
              <DropdownMenu.Separator className="rl-radix-separator"/>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger className="rl-radix-item">
                  更多筛选 <span className="rl-radix-shortcut">▸</span>
                </DropdownMenu.SubTrigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.SubContent className="rl-radix-menu" sideOffset={6}>
                    <DropdownMenu.Item className="rl-radix-item" onSelect={() => report('仅本地查看未读文章')}>
                      只看未读
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="rl-radix-item" onSelect={() => report('已切换到最近收藏')}>
                      最近收藏
                    </DropdownMenu.Item>
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>
              <DropdownMenu.Item disabled={locked} className="rl-radix-item rl-radix-danger"
                onSelect={() => report('仅删除本地收藏，不调用真实API')}>
                删除本地收藏 {locked ? '（已禁用）' : ''}
              </DropdownMenu.Item>
            </>}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
    <p role="status">菜单{open ? '已打开' : '已关闭'} ·
      置顶：{pinned ? '是' : '否'} · 排序：{sort === 'new' ? '最新' : '热度'} · {message}</p>
    {level === 'advanced' && <p>使用触发按钮按 Enter/Space 打开、方向键导航、Esc 关闭后返回触发器；锁定项不能选择。没有实现自制全局 keydown/focus trap。</p>}
  </section>;
