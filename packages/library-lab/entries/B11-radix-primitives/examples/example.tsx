import {useState} from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import './dropdown.css';
import {deleteFeed, visibleFeeds, type Feed, type FeedScope, type FeedSort} from './feed-policy';

type Level = 'basic' | 'business' | 'advanced';
const START_FEEDS: Feed[] = [
  {id: 'browser', title: '浏览器工程', unread: 7, saved: 3, heat: 93, updated: 3},
  {id: 'design', title: '设计系统', unread: 0, saved: 4, heat: 70, updated: 2},
  {id: 'release', title: '版本发布', unread: 5, saved: 0, heat: 88, updated: 1},
];

export default function RadixPrimitivesExample({level}: {level: Level}) {
  const [open, setOpen] = useState(false);
  const [feeds, setFeeds] = useState<Feed[]>(START_FEEDS);
  const [selectedFeedId, setSelectedFeedId] = useState('browser');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [scope, setScope] = useState<FeedScope>('all');
  const [sort, setSort] = useState<FeedSort>('new');
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState('尚未执行任何操作');
  const selectedFeed = feeds.find(feed => feed.id === selectedFeedId);
  const pinned = pinnedIds.includes(selectedFeedId);
  const visible = visibleFeeds(feeds, scope, sort, pinnedIds);
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
      <p><strong>当前订阅：</strong>{selectedFeed?.title ?? '暂无可用频道'}</p>
      <div className="rl-radix-feeds" role="group" aria-label="本地订阅频道">
        {visible.length === 0 && <p>当前筛选没有频道，可通过菜单重置筛选。</p>}
        {visible.map(feed => <button key={feed.id} type="button" aria-pressed={feed.id === selectedFeedId}
          onClick={() => setSelectedFeedId(feed.id)}>
          {pinnedIds.includes(feed.id) ? '★ ' : ''}{feed.title} · 未读 {feed.unread} · 收藏 {feed.saved}
        </button>)}
      </div>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button type="button" className="rl-radix-trigger">更多操作 ▾</button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="start" sideOffset={8}
            className="rl-radix-menu" aria-label="订阅操作">
            <DropdownMenu.Label className="rl-radix-label">对“{selectedFeed?.title ?? "无频道"}”执行</DropdownMenu.Label>
            <DropdownMenu.Item className="rl-radix-item" onSelect={() => report('已在本地模拟打开订阅详情')}>
              查看详情 <span className="rl-radix-shortcut">Enter</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item className="rl-radix-item"
              onSelect={() => {if (!selectedFeed) return;
                setFeeds(old => old.map(feed => feed.id === selectedFeedId ? {...feed, title: '工程精选（本地更名）'} : feed));
                report('当前订阅已在本地更名');}}>
              重命名（本地）
            </DropdownMenu.Item>
            {level !== 'basic' && <>
              <DropdownMenu.Separator className="rl-radix-separator"/>
              <DropdownMenu.CheckboxItem className="rl-radix-item"
                checked={pinned} disabled={!selectedFeed} onCheckedChange={value => {
                  setPinnedIds(old => value ? Array.from(new Set([...old, selectedFeedId])) : old.filter(id => id !== selectedFeedId));
                  report(value ? '已置顶当前频道' : '已取消当前频道置顶');
                }}
                onSelect={event => event.preventDefault()}>
                <DropdownMenu.ItemIndicator className="rl-radix-indicator">✓</DropdownMenu.ItemIndicator>
                收藏置顶
              </DropdownMenu.CheckboxItem>
              <DropdownMenu.Label className="rl-radix-label">排序方式</DropdownMenu.Label>
              <DropdownMenu.RadioGroup value={sort}
                onValueChange={value => {setSort(value === 'popular' ? 'popular' : 'new');report('列表排序已更新');}}>
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
                    <DropdownMenu.Item className="rl-radix-item" onSelect={() => {setScope('unread');setSelectedFeedId(visibleFeeds(feeds, 'unread', sort, pinnedIds)[0]?.id ?? '');report('列表仅显示有未读的频道');}}>
                      只看未读
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="rl-radix-item" onSelect={() => {setScope('saved');setSelectedFeedId(visibleFeeds(feeds, 'saved', sort, pinnedIds)[0]?.id ?? '');report('列表仅显示有收藏的频道');}}>
                      最近收藏
                    </DropdownMenu.Item>
                  </DropdownMenu.SubContent>
                </DropdownMenu.Portal>
              </DropdownMenu.Sub>
              <DropdownMenu.Item className="rl-radix-item" onSelect={() => {setScope('all');setSelectedFeedId(visibleFeeds(feeds, 'all', sort, pinnedIds)[0]?.id ?? '');report('已恢复全部频道');}}>
                显示全部频道
              </DropdownMenu.Item>
              <DropdownMenu.Item disabled={locked || !selectedFeed} className="rl-radix-item rl-radix-danger"
                onSelect={() => {if (locked || !selectedFeed) return;
                  setFeeds(old => deleteFeed(old, selectedFeedId, locked));
                  setPinnedIds(old => old.filter(id => id !== selectedFeedId));
                  setSelectedFeedId(feeds.find(feed => feed.id !== selectedFeedId)?.id ?? '');
                  report('当前订阅已从本地演示列表删除');
                }}>
                删除当前订阅 {locked ? '（已禁用）' : ''}
              </DropdownMenu.Item>
            </>}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
    <p role="status">菜单{open ? '已打开' : '已关闭'} ·
      置顶：{pinned ? '是' : '否'} · 排序：{sort === 'new' ? '最新' : '热度'} · 筛选：{scope} · {message}</p>
    {level === 'advanced' && <p>使用触发按钮按 Enter/Space 打开、方向键导航、Esc 关闭后返回触发器；锁定项不能选择。没有实现自制全局 keydown/focus trap。</p>}
  </section>;
}
