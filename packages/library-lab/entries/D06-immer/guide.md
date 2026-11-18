# Immer：写嵌套更新，保留未改分支

RSS 阅读器要改分组名、按文章 ID 切换已读，还要允许撤销一次未确认的插入。手写多层 spread 容易漏复制祖先；Immer 让你在同步 recipe 中写近似原地赋值的代码，返回新的不可变状态。未改的分支仍复用引用，旧快照保留原值。

适合嵌套纯数据和复杂 reducer。单个计数器、简单 map 更新不一定值得增加依赖。Redux Toolkit reducer 已经使用 Immer；TanStack Query 仍拥有服务器缓存，Immer 只负责计算下一份值。多人协作用 CRDT 等合并模型，Immer Patch 没有冲突解决能力。本例固定 `immer@11.2.9`（MIT），React 由宿主提供。

## 先理解 base、draft、next

`produce(base, recipe)` 将 base 包装成临时 Proxy draft。同步 recipe 写入 draft；结束时生成 next，只复制被修改的路径。draft 不能离开 recipe，更不能跨 await。没有变更时返回 base 本身，避免无意义的新引用；这不等于保证 React 永不重渲染。

```tsx
import {produce} from 'immer';
const next = produce(base, draft => {
  const story = draft.section.stories.find(item => item.id === 's1');
  if (story) story.read = true;
});
// next.section.stories[1] === base.section.stories[1]
```

`next` 交给 React state；不要直接修改旧 state。recipe 中要么修改 draft，要么返回整体替换值，不能两者同时做。给参数 `draft = other` 只是改变量绑定，不会替换树；要用 `return other`。`return undefined` 不是清空状态，整体变成 undefined 需类型允许并返回 `nothing`。

## 三个独立实验

### 1. 改名：看见结构共享

在 basic 将「分组名」改为「开源」，点「更新分组」。当前状态的名称改变、revision 加一，更新前快照仍为「前端工程」。引用面板执行真实 `===`：rootShared/sectionShared 为 false，storiesArrayShared 和两篇故事的 shared 都为 true。JSON 值相同不能证明共享，所以这里单独比较引用。

再次提交相同名称不会写入任何 draft 字段，rootShared 变为 true、revision 不增加。空白名称使用「未命名分类」。代码在 [`feed-model.mjs`](examples/feed-model.mjs) 的 `renameFeed` 与 `referenceReport`。

### 2. 阅读任务：按 ID 更新与批量 no-op

business 勾选第一篇故事：它的 shared 为 false，未动的第二篇仍为 true，数组和祖先则为新引用。React key 与查找均使用稳定 ID，而不是数组位置。点「全部标记已读」后所有故事变为已读；再点一次，整树共享、revision 不变。批量操作只在确有未读故事时增加一次 revision。源码 `toggleStory` / `markAllRead`。

### 3. 本地事务：Patch 与一次撤销

advanced 点「生成乐观更新」，本地列表头部插入 `optimistic-<revision>`，面板显示真实 `produceWithPatches` 正向 Patch。调用前必须 `enablePatches()`。返回值为 `[next, patches, inversePatches]`；path 是路径片段数组，不是 RFC JSON Pointer 字符串，Patch 也不保证最少。

待确认时锁住所有 feed 写入。「模拟失败并撤销」同步取走 inverse，再让 React updater 用这个局部常量执行 `applyPatches`，恢复原内容；「确认本地变更」只丢掉撤销记录并保留新内容。两个按钮都是本地教学动作，没有后端请求、网络失败或持久化。回滚后引用不一定与最初快照一致，验证内容恢复，不承诺恢复对象身份。

[`patch-ownership.mjs`](examples/patch-ownership.mjs) 的 `takeUndo` 必须保留：不能先清 ref，再在延迟 updater 中读取 ref。示例用同步 ref 阻止重复点击，最新快照 ref 让同一批尚未提交渲染的事件也基于最新数据计算。updater 本身没有修改 ref 或其它副作用。

## 迁入项目的最短路径

在已有 React + TypeScript 应用执行 `pnpm add immer@11.2.9`。复制 `examples/example.tsx`、`feed-model.mjs`、`feed-model.d.mts`、`patch-ownership.mjs`、`patch-ownership.d.mts`，保持相对路径。入口 `demo.tsx` 只是 Lab 重导出，可直接使用 `import ImmerWorkshop from './example'`，渲染 `<ImmerWorkshop level="business" />`。三个 level 共用该组件，没有 Lab 内部模块依赖。

不需要 Provider、CSS 插件、环境变量、Worker 或服务。`demo-controls` 仅为宿主布局类，缺少它不影响行为；移植时自行提供排版。运行环境需要现代浏览器的 `structuredClone`；TypeScript 使用支持 `.mjs` / `.d.mts` 的 bundler 模块解析。模块级 `enablePatches()` 启用插件，不要通过改全局 autoFreeze 来绕开错误。

state 与撤销 ref 由组件持有，卸载即丢弃，没有定时器、监听或外部资源要注销。重新挂载从克隆后的 fixture 开始。需要保存时，将同步 produce 的结果交给状态拥有者；不要把 draft 存进缓存、队列或异步回调。

## 接真实服务时先处理所有权

此例锁住整份 feed，保证 inverse 只应用到对应的本地操作。真实请求期间如果服务器推送或另一份缓存写入改变了数据，这个前提就不存在：给乐观操作绑定请求 token 与基础版本，错误时仅在所有权/版本仍匹配时回滚；不匹配则丢弃旧 inverse、重新拉取并协调。abort 不保证对端停止。不要把本例确认按钮当成保存 API。

远端 Patch 必须验证来源、授权和路径；它不是可直接执行的外部命令。新插入的外部对象也不会自动变 draft，不要插入后再修改同一个外部引用。按 ID 查找，不用 draft 对象与原始对象的 `===` 寻址。内层 produce 的返回值必须赋回外层，否则结果丢失。本例不使用 Map/Set 或 Array Methods 插件，启用其它插件前核对匹配版本行为。

## 来源和验证

官方 [produce 文档](https://immerjs.github.io/immer/produce/) 与 [Patch 文档](https://immerjs.github.io/immer/patches/) 解释机制；固定 v11.2.9 的源码与本地 `dist/immer.d.ts` 核对实际 API。README 页签保存固定提交的上游英文原文，该提交没有中文 README；官网入口为官方中文站。官网响应证据见 `official/source-evidence.json`，没有从 Lab origin 确认 iframe，因此嵌入状态 unknown。

`tests/sdk.test.mjs` 导入真实 Immer 和示例模型，断言共享/no-op/撤销。浏览器提案覆盖上述操作与卸载重挂载。实际命令、原始日志和六项状态见 `local-validation.md`；没有正式匹配收据时 verification.json 的 sdk/build/browser 均保持 NOT_RUN。
