# Jotai 3.0.1｜原子、派生值和按会话隔离的 Store

Lab 锁定 `jotai@3.0.1`（MIT）。v3 是 ESM，文档要求 React 18 以上、TypeScript 5.5 以上。`atom()` 得到的是配置对象，值放在 `Store` 里。同一份配置挂到两个 store，数值各自独立。它管客户端状态图，不管查询缓存和鉴权。

3.0.1 修正 3.0.0 里 `useAtomValue` 在挂载时序上的回归。不要为了演示改回 3.0.0。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。原子定义在 [`examples/workspace-atoms.mjs`](examples/workspace-atoms.mjs) 的模块作用域：`counterAtom`、`doubleAtom`、`storiesAtom`、`unreadAtom`、只写的 `toggleReadAtom`。不要在渲染函数里 `atom()`，否则每次都是新配置，订阅会断。

`TenantWorkspace` 用 `useMemo(() => createStore(), [])` 创建 store，包在 `<Provider store={store}>` 里。没有 Provider 时会落到默认共享 store，团队数据会串。advanced 用 `key={'team-A-session-' + teamASession}`。点击「退出并新建团队 A 会话」会卸载旧 Provider。团队 B 是另一个 key，换 A 的会话不会重置 B。离开 advanced 时 B 的组件卸载，store 一起走。

写入原子调用 [`examples/story-policy.mjs`](examples/story-policy.mjs) 的 `toggleStoryRead`。它要求故事 id 唯一且非空，`read` 是布尔。未知 id 返回原数组。重复 id 或坏形状抛错，而不是悄悄改两行。组件列表的 React key 也是 `story.id`。

basic 只显示计数和双倍。business 增加未读数和勾选。advanced 并排两个 store。

没有挂载：`atomWithStorage`、async atom、Suspense、`onMount`、本地 HTTP。本指南围绕这三个同步状态实验；异步与持久化按官方指南另行设计。

## 什么时候用

大量彼此独立、又要派生的界面状态，用原子。一个输入框用 `useState` 或 React Hook Form。远程列表的新鲜度用 TanStack Query。互斥流程用 XState。需要全量 action 日志时用 Redux Toolkit。不要给每个 DOM 属性建原子。

官方 `atomWithStorage` 默认走 `localStorage` 和 JSON，并可听 `storage` 事件。JSON 没有 schema，隐私模式会抛配额错误，不能存令牌。Lab 故意不持久化。SSR 不能在模块顶层读 `window`。`getOnInit: true` 会让首帧和服务器 HTML 不一致，要单独设计水合。

## 模型

读派生原子时，`get` 记下依赖。写函数里的 `get` 不是订阅。`store.get` / `store.set` / `store.sub` 不依赖 React。`sub` 返回取消函数。

`useAtom` 又读又写，都会订阅。`useAtomValue` 只订阅值。`useSetAtom` 拿 setter，不因为值变化而重渲染该按钮。Lab 的「+1」用 `useAtom`，勾选用 `useSetAtom(toggleReadAtom)`。

```tsx
const doubleAtom = atom(get => get(counterAtom) * 2)
```

不要再用 `useEffect` 把 double 抄进另一份 state。

async 读原子可以拿到 `signal`。依赖变了，下一次计算前会 abort。把 signal 交给 `fetch`。读取异步值的组件应被 Suspense 和 Error Boundary 覆盖。abort 不是事务回滚。`onMount` 在第一次被订阅时运行，Strict Mode 会多一次卸载和挂载，setup 和 cleanup 要成对。只调用 `useSetAtom` 不会因为没人读值就触发 `onMount`。

Provider 省略时的默认 store 是进程内共享的。租户、草稿和未读都不能放进去。

## 三层示例

### 基本

团队 A 一个 store。计数加一，派生值跟着翻倍。归零只影响这个 store。当前实现也读取故事原子，但 basic 不显示它们；它们不会触发网络或存储。

### 业务

未读数来自 `unreadAtom`。勾选调用写原子，按 id 翻转。两行的 id 是 `rss-1` 和 `rss-2`。策略函数若发现重复 id，会在写入前抛错。

### 进阶

团队 A 和团队 B 同时可见。把 A 的计数加到 3，再新建会话，A 回到 0，B 保持。这是卸载 store，不是把同一个 store 里的原子清零。文案提醒：UI 原子换了，远端缓存和请求也要按身份分开清。

## 反例

### 反例 1：渲染期间创建原子

```tsx
function Panel() {
  const counterAtom = atom(0)
  const value = useAtomValue(counterAtom)
}
```

原子提到模块；确实依赖 props 的配置可用 `useMemo` 稳定引用，不能每次 render 无条件创建新 atom。

### 反例 2：默认 store 放租户数据

```tsx
useAtomValue(storiesAtom)
```

在没有 Provider 的树里，这就是默认 store。Lab 的工作区始终包 Provider。

### 反例 3：用下标当故事身份

```tsx
set(storiesAtom, stories.map((story, index) => index === target ? { ...story, read: !story.read } : story))
```

```tsx
set(storiesAtom, toggleStoryRead(get(storiesAtom), id))
```

### 反例 4：派生值再抄一份

```tsx
const doubled = useAtomValue(doubleAtom)
const [copy, setCopy] = useState(doubled)
useEffect(() => setCopy(doubled), [doubled])
```

直接渲染 `doubled`。

### 反例 5：在写原子里发请求并当成缓存

写原子可以编排，但响应数据的主人仍是 Query。不要把列表 JSON 存进原子再持久化。

### 反例 6：async 原子不传 signal

依赖变化后旧 I/O 仍可能继续消耗资源。把 `signal` 交给实际 I/O；这不等于业务副作用自动回滚。

### 反例 7：读取异步原子却没有 Suspense 边界

读取未完成 Promise 的组件需要 Suspense 和错误边界。Suspense 的位置应覆盖读取者；并非 Jotai 强制必须位于 Provider 内。Lab 没有 async 原子，所以界面上没有这个边界。

### 反例 8：atomWithStorage 存令牌

存储可被同源脚本读到。收藏 id 若要持久化，先做长度和字符校验，并在登出时删键。Lab 不使用该工具。

### 反例 9：依赖 v3 已删除的工具

按 v3 迁移文档改 import。不要从旧博客复制 `jotai/utils` 里已经移除的辅助函数。本示例只用核心 `atom`、`createStore`、`Provider` 和三个 hook。

## 组合

**Query**：搜索条件可以是原子，请求结果不要再写进另一个原子。queryKey 使用原子里的团队 id。切会话时除了卸载 Provider，还要清该身份的 Query 缓存。

**XState**：审批的互斥状态留在机器里。Jotai 只放当前选中的 id。

**Immer**：原子里保存纯数据。若更新很深，在写函数里 `produce` 一次，不要让组件拿到 draft。

## 生产核对清单

1. 原子定义的引用在组件生命周期内稳定。
2. 每个会话有自己的 store，并用 key 强制卸载。
3. 写路径按业务 id；重复 id 失败而不是改两行。
4. 只写按钮用 `useSetAtom`，避免无意义订阅。
5. 派生值不复制到 `useState`。
6. 默认 store 没有租户数据。
7. 若引入 async atom，signal 传到 fetch，边界覆盖异步读取者。
8. 持久化有 schema、长度上限和登出删除；不存秘密。

## 升级

钉 `3.0.1`。从 v2 迁到 v3 时按官方迁移指南核对 React、TypeScript 和 Node 要求，以及被删除的 API。3.0.0 的 `useAtomValue` 时序问题由 3.0.1 修正，不要停在 3.0.0。

Store 的 `get/set/sub` 是不经过 hook 的测试入口。升级后用两个 store 断言同一原子配置互不污染。

## 验收

- 计数加一后派生值是两倍；归零只影响当前 store。
- 勾选只翻转目标 id，另一行的 `read` 不变，原数组不被修改。
- 未知 id 返回原数组引用。
- 重复 id、缺 id、非布尔 `read` 抛错。
- 新建团队 A 会话后 A 的计数消失，B 仍在。
- `tests/sdk.test.mjs` 使用真实 `jotai` 的 store 与写原子。无收据则 NOT_RUN。

练习：给收藏 id 列表加一个带校验的存储适配器，损坏 JSON 时回到空列表。再把慢请求放进 async 原子，连点时旧 signal 取消，且 Error Boundary 能恢复。

写原子里的 `get` 不会建立订阅。把 `get(storiesAtom)` 放在 `toggleReadAtom` 里只是为了读当前快照。组件要更新，仍需 `useAtomValue`。

## 资料

- https://jotai.org/docs
- https://jotai.org/docs/core/atom
- https://jotai.org/docs/core/store
- https://jotai.org/docs/core/provider
- https://jotai.org/docs/guides/migrating-to-v3
- https://jotai.org/docs/guides/async
- https://jotai.org/docs/utilities/storage
- https://github.com/pmndrs/jotai/releases/tag/v3.0.1

## 最小接入与完整迁移

在已有 React 18+、TypeScript 5.5+ 的 ESM 项目运行 `pnpm add jotai@3.0.1`。复制 examples 下的 `example.tsx`、`workspace-atoms.mjs` / `.d.mts`、`story-policy.mjs` / `.d.mts`；后两对声明用于 TypeScript 识别同目录 JavaScript。Lab 的 demo.tsx 只是入口转发，独立项目可直接渲染 `<JotaiWorkshop level="advanced" />`，无需 Lab 配置、账号或 CSS 才能操作。

```tsx
import { Provider, atom, useAtom, useAtomValue } from 'jotai'
const count = atom(0)
const doubled = atom(get => get(count) * 2)
function Counter() {
  const [value, set] = useAtom(count)
  const double = useAtomValue(doubled)
  return <button onClick={() => set(value + 1)}>{value} / {double}</button>
}
// 每个 Provider 拥有自己的 Store；复用 atom 配置不共享值。
const App = () => <Provider><Counter /></Provider>
```

业务增加已读标记时，不再单独 set 未读总数：写 atom 按稳定 id 产出新数组，unreadAtom 在同一 Store 内从列表派生。advanced 保留同一组配置，在 A/B Provider 里验证隔离。先把 B 加1并勾选一篇，再修改 A；新建 A 会话后 A 应回到 count0/未读2，B 的 count1/未读1 保留。实际授权和远程缓存隔离须由业务实现。

`story-policy` 是本例自建业务校验，不是 Jotai 内置 schema。重复 id、空 id、非布尔 read 抛 TypeError，写入前失败，不生成部分修改。fixture 是两篇本地文章，无请求、持久化或付费服务。离开页签或 keyed 重挂时由 React 释放订阅；若迁入 store.sub，必须调用其返回的 unsubscribe。
