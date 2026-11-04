# React Virtuoso · 业务长列表的虚拟化

## 适用与边界

React Virtuoso 把大量数据映射到有限的可见 DOM，自动测量可变高度，适合 RSS 阅读流、搜索结果、审计日志和历史消息。对于较短列表，先使用普通列表。它**不管理业务分页、请求缓存、服务器过滤、授权与数据持久化**。对复杂自由布局和底层测量策略，参考 C10 TanStack Virtual。

基线 react-virtuoso 4.18.19（MIT）；React 19 兼容性仍待此分支真实浏览器验证。独立 @virtuoso.dev/message-list 产品不属于本包，不能由本包 MIT 许可推断其商业许可。

## 安装与入口

~~~bash
pnpm add react-virtuoso@4.18.19
~~~

真实实现：examples/example.tsx；页面适配入口：examples/demo.tsx。Library Lab 先加载分类，不启动示例；点击运行后才动态引入 SDK。

~~~tsx
import {Virtuoso} from 'react-virtuoso';
<Virtuoso style={{height: 360}} data={articles}
  computeItemKey={(_index, item) => item.id}
  itemContent={(_index, item) => <article>{item.title}</article>} />
~~~

## 三个真实示例

**入门**：10,000 条变长虚构文章，显示真实窗口范围，支持跳转靠近末尾。窗口化节省 DOM 节点，不减少 10,000 个 JS 对象的占用。检查可见 DOM 数时必须在浏览器完成，不能虚构性能数字。

**业务**：固定数据的 RSS 搜索和按段加载；中文 IME 由显式提交控制，避免每次拼音合成触发请求；endReached 重复触发由同步 pending ref 门禁隔离；切换筛选取消旧的模拟延迟并重建滚动测量上下文。没有真实 HTTP，不能标记网络请求层验收。

**进阶**：历史前插与 firstItemIndex 在同一次状态更新中同步减量；computeItemKey 使用 id；展开消息增加实际 DOM 高度后交由 Virtuoso 重测；仅当用户位于底部时追加消息自动跟随。该示例不等于商业聊天消息列表组件。

## 工作机制

状态所有权：外部保存数据、游标、搜索和权限；Virtuoso 只负责可见窗口、滚动尺寸和视图快照。组件数据变化必须维持稳定业务 id，不要将 index 当永久键。容器必须有明确高度（普通高度或祖先 flex + min-height:0）。

需要向前插入时 firstItemIndex 需要保留足够余量，且保持非负。restoreStateFrom 是测量与位置快照，**不是数据快照**：搜索、用户或排序变化不能盲目复用。正文以 padding 控制内距，避免子元素外边距塌陷影响测量。dynamic data 下 defaultItemHeight 是估计，不能错误配置 fixedItemHeight。

## 专属反例与修复

1. **无容器高度导致空白**：明确视口高度，检查 flex 祖先 min-height:0。
2. **index 当业务 key**：新增、删除、筛选和前插后会错误重用内容；使用 computeItemKey。
3. **endReached 无限翻页**：同步锁、hasMore 和响应版本双重门禁，不能只依赖 loading state。
4. **在 itemContent 内发请求**：滚动回收会触发重复副作用；请求归独立数据层管理。
5. **插入历史仅修改数组**：firstItemIndex 与数组同时原子更新，不靠估计 scrollTop。
6. **误把本地 fixture 当接口验收**：浏览器动态测量需要 Playwright/Chromium 或真实环境验证。

## 组合与练习

与 TanStack Query 组合时 Query 拥有异步数据和缓存键，Virtuoso 管窗口；与 TanStack Table 组合时 Table 管业务行和排序模型。练习：为新闻列表加入数据来源变化后的滚动定位策略、错误页重试以及每页游标的后台合同测试。

## 验证

本次仅提交针对真实 SDK 的入口与源码，未运行 npm 安装、真实 SDK 集成、TS 类型检查、构建或浏览器测量；verification.json 为 NOT_RUN。必须在实际浏览器测：滚动跳转、动态高度、前插锚点、键盘焦点和卸载。

## 一手资料

- https://virtuoso.dev/react-virtuoso/
- https://virtuoso.dev/react-virtuoso/api-reference/virtuoso/
- https://github.com/petyosi/react-virtuoso/releases/tag/react-virtuoso%404.18.19

## 补充：同条件重新搜索也必须恢复窗口身份

业务层即使重复提交相同关键词，也会从头加载 30 条，因此 `Virtuoso key={query}` 不足以重置仍停留在底部的滚动位置。当前实际示例使用独立 `viewRevision` 作为 viewport key，`nextViewRevision` 每次合法提交递增；筛选词由 `normalizeFeedQuery` 做 NFC/控制字符和 80 码点上界，`nextWindowLimit` 对最后一页设定明确上界。相同 helper 在 `examples/view-policy.mjs`，由组件直接 import，`tests/view-policy.test.mjs` 执行纯 Node 回归。它们并不证明 Virtuoso 的浏览器滚动已经通过，真实窗口重置、IME、末页 endReached 和滚动锚点仍需 Chromium 验证。
