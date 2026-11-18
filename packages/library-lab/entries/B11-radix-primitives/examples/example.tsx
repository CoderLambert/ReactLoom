import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useState } from 'react'
import './dropdown.css'
import {
  chooseVisibleFeedId,
  deleteFeed,
  type Feed,
  type FeedScope,
  type FeedSort,
  visibleFeeds,
} from './feed-policy'

type Level = 'basic' | 'business' | 'advanced'
const START_FEEDS: Feed[] = [
  { id: 'browser', title: '浏览器工程', unread: 7, saved: 3, heat: 93, updated: 3 },
  { id: 'design', title: '设计系统', unread: 0, saved: 4, heat: 70, updated: 2 },
  { id: 'release', title: '版本发布', unread: 5, saved: 0, heat: 88, updated: 1 },
]
export default function RadixPrimitivesExample({ level }: { level: Level }) {
  const [open, setOpen] = useState(false)
  const [feeds, setFeeds] = useState<Feed[]>(START_FEEDS)
  const [selectedFeedId, setSelectedFeedId] = useState('browser')
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [scope, setScope] = useState<FeedScope>('all')
  const [sort, setSort] = useState<FeedSort>('new')
  const [locked, setLocked] = useState(false)
  const [message, setMessage] = useState('尚未执行任何操作')
  const visible = visibleFeeds(feeds, scope, sort, pinnedIds)
  const selectedFeed = visible.find((feed) => feed.id === selectedFeedId)
  const pinned = pinnedIds.includes(selectedFeedId)
  function filter(next: FeedScope) {
    setScope(next)
    setSelectedFeedId(chooseVisibleFeedId(feeds, selectedFeedId, next, sort, pinnedIds))
    setMessage(`筛选已更新为 ${next}；仅从当前可见频道中选择`)
  }
  function removeCurrent() {
    if (locked || !selectedFeed) return
    const nextFeeds = deleteFeed(feeds, selectedFeedId, locked)
    const nextPins = pinnedIds.filter((id) => id !== selectedFeedId)
    setFeeds(nextFeeds)
    setPinnedIds(nextPins)
    setSelectedFeedId(chooseVisibleFeedId(nextFeeds, selectedFeedId, scope, sort, nextPins))
    setMessage('当前订阅已从本地数组删除；未调用服务器')
  }
  return (
    <section
      aria-label="Radix DropdownMenu 真实交互示例"
      className="rl-radix-lab"
      data-testid="b11-workshop"
      data-open={open}
      data-scope={scope}
      data-sort={sort}
      data-selected={selectedFeedId}
      data-count={feeds.length}
      data-visible={visible.length}
      data-order={visible.map((feed) => feed.id).join(',')}
    >
      <h2>
        {level === 'basic'
          ? '原生触发器、选择与回焦'
          : level === 'business'
            ? '复选置顶与单选排序'
            : '嵌套筛选、禁用与可见身份'}
      </h2>
      <p>
        真实Radix原语管理键盘、typeahead、ARIA和Portal；列表是本地fixture，无网络与服务端权限系统。
      </p>
      {level === 'advanced' && (
        <div className="rl-radix-controls">
          <label>
            <input
              type="checkbox"
              checked={locked}
              onChange={(event) => setLocked(event.target.checked)}
            />
            锁定删除权限
          </label>
          <button
            type="button"
            className="rl-radix-reset"
            onClick={() => {
              setFeeds(START_FEEDS)
              setPinnedIds([])
              setSelectedFeedId('browser')
              setScope('all')
              setSort('new')
              setMessage('已恢复三条演示数据；锁定设置保留')
            }}
          >
            恢复演示数据
          </button>
        </div>
      )}
      <div className="rl-radix-workspace">
        <p>
          <strong>当前订阅：</strong>
          <output data-testid="b11-selected">{selectedFeed?.title ?? '暂无可用频道'}</output>
        </p>
        <fieldset className="rl-radix-fieldset">
          <legend>本地订阅频道</legend>
          <div className="rl-radix-feeds" data-testid="b11-feeds">
            {visible.length === 0 && <p>当前筛选没有频道，可通过菜单恢复全部或恢复演示数据。</p>}
            {visible.map((feed) => (
              <button
                key={feed.id}
                type="button"
                data-feed-id={feed.id}
                aria-pressed={feed.id === selectedFeedId}
                onClick={() => setSelectedFeedId(feed.id)}
              >
                {pinnedIds.includes(feed.id) ? '★ ' : ''}
                {feed.title} · 未读 {feed.unread} · 收藏 {feed.saved}
              </button>
            ))}
          </div>
        </fieldset>
        <DropdownMenu.Root open={open} onOpenChange={setOpen}>
          <DropdownMenu.Trigger asChild>
            <button type="button" className="rl-radix-trigger" data-testid="b11-trigger">
              更多操作 <span aria-hidden="true">▾</span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={8}
              collisionPadding={8}
              className="rl-radix-menu"
            >
              <DropdownMenu.Label className="rl-radix-label">
                对“{selectedFeed?.title ?? '无频道'}”执行
              </DropdownMenu.Label>
              <DropdownMenu.Item
                disabled={!selectedFeed}
                className="rl-radix-item"
                textValue="details"
                onSelect={() => {
                  if (selectedFeed)
                    setMessage(
                      `查看详情：${selectedFeed.title}，未读${selectedFeed.unread}，收藏${selectedFeed.saved}`,
                    )
                }}
              >
                查看详情{' '}
                <span className="rl-radix-shortcut" aria-hidden="true">
                  Enter
                </span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                disabled={!selectedFeed}
                className="rl-radix-item"
                textValue="rename"
                onSelect={() => {
                  if (!selectedFeed) return
                  setFeeds((old) =>
                    old.map((feed) =>
                      feed.id === selectedFeedId
                        ? { ...feed, title: '工程精选（本地更名）' }
                        : feed,
                    ),
                  )
                  setMessage('当前订阅已在本地更名，业务ID保持不变')
                }}
              >
                重命名（本地）{' '}
                <span className="rl-radix-shortcut" aria-hidden="true">
                  R 定位
                </span>
              </DropdownMenu.Item>
              {level !== 'basic' && (
                <>
                  <DropdownMenu.Separator className="rl-radix-separator" />
                  <DropdownMenu.CheckboxItem
                    className="rl-radix-item"
                    checked={pinned}
                    disabled={!selectedFeed}
                    onCheckedChange={(value) => {
                      if (!selectedFeed) return
                      setPinnedIds((old) =>
                        value
                          ? Array.from(new Set([...old, selectedFeedId]))
                          : old.filter((id) => id !== selectedFeedId),
                      )
                      setMessage(value ? '已置顶当前频道' : '已取消当前频道置顶')
                    }}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <DropdownMenu.ItemIndicator className="rl-radix-indicator" aria-hidden="true">
                      ✓
                    </DropdownMenu.ItemIndicator>
                    收藏置顶
                  </DropdownMenu.CheckboxItem>
                  <DropdownMenu.Label className="rl-radix-label">排序方式</DropdownMenu.Label>
                  <DropdownMenu.RadioGroup
                    value={sort}
                    onValueChange={(value) => {
                      setSort(value === 'popular' ? 'popular' : 'new')
                      setMessage('列表排序已更新；菜单仍可继续操作')
                    }}
                  >
                    <DropdownMenu.RadioItem
                      value="new"
                      className="rl-radix-item"
                      onSelect={(event) => event.preventDefault()}
                    >
                      <DropdownMenu.ItemIndicator className="rl-radix-indicator" aria-hidden="true">
                        ●
                      </DropdownMenu.ItemIndicator>
                      最新优先
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem
                      value="popular"
                      className="rl-radix-item"
                      onSelect={(event) => event.preventDefault()}
                    >
                      <DropdownMenu.ItemIndicator className="rl-radix-indicator" aria-hidden="true">
                        ●
                      </DropdownMenu.ItemIndicator>
                      热度优先
                    </DropdownMenu.RadioItem>
                  </DropdownMenu.RadioGroup>
                </>
              )}
              {level === 'advanced' && (
                <>
                  <DropdownMenu.Separator className="rl-radix-separator" />
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger className="rl-radix-item">
                      更多筛选{' '}
                      <span className="rl-radix-shortcut" aria-hidden="true">
                        ▸
                      </span>
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.SubContent
                        className="rl-radix-menu"
                        sideOffset={6}
                        collisionPadding={8}
                      >
                        <DropdownMenu.Item
                          className="rl-radix-item"
                          onSelect={() => filter('unread')}
                        >
                          只看未读
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="rl-radix-item"
                          onSelect={() => filter('saved')}
                        >
                          有收藏的频道
                        </DropdownMenu.Item>
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>
                  <DropdownMenu.Item className="rl-radix-item" onSelect={() => filter('all')}>
                    显示全部频道
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    disabled={locked || !selectedFeed}
                    className="rl-radix-item rl-radix-danger"
                    onSelect={removeCurrent}
                  >
                    删除当前订阅{locked ? '（已禁用）' : ''}
                  </DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <p role="status" data-testid="b11-status">
        菜单{open ? '已打开' : '已关闭'} · 置顶：{pinned ? '是' : '否'} · 排序：
        {sort === 'new' ? '最新' : '热度'} · 筛选：{scope} · {message}
      </p>
      {level === 'advanced' && (
        <p>
          锁定是本地fixture约束，disabled和删除守卫双重检查；生产权限仍需服务器。触发器持续存在，关闭后由Radix回焦。无需自制全局keydown或焦点陷阱。
        </p>
      )}
    </section>
  )
}
