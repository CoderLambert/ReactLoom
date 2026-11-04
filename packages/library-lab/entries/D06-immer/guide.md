# Immer 11.2.9｜结构共享、显式 Patch 和同步回滚

Lab 锁定 `immer@11.2.9`（MIT）。研究笔记里的 11.1.21 不是当前钉。用 `import { produce, produceWithPatches, applyPatches, enablePatches } from 'immer'`。它描述嵌套数据的下一份不可变状态，并在未改动的分支上复用引用。它不拥有网络、权限、Query 缓存或 CRDT。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。模块加载时调用一次 `enablePatches()`。初始状态是两篇本地故事，没有请求。

`toggleStory` 用 `produce`：按 `id` 找到故事并翻转 `read`，然后 `revision++`。分组改名同样在 recipe 里改 `draft.section.name`。React state 始终换成 produce 的返回值，不在渲染期间改上一份 state。

advanced 用 `produceWithPatches` 在列表头部插入一条乐观故事，正向 patches 显示在 `<pre>` 里，逆向 patches 放进 ref。回滚调用 [`examples/patch-ownership.mjs`](examples/patch-ownership.mjs) 的 `takeUndo`：先同步读出 inverse 并清空 ref，再把这份数组交给 `setFeed(current => applyPatches(current, inverse))`。React 可能推迟 updater，若在 updater 里再读 ref，会读到已经被清掉的值，或者误用下一次乐观更新的 inverse。

乐观未确认时输入和切换被禁用。确认只是本地丢掉 inverse，没有网络提交。文案写明：并发写入时，逆向 Patch 不能无条件盖住更新的服务器结果。

没有挂载：`enableMapSet`、`enableArrayMethods`、`current` / `original`、Query 的 `setQueryData`、Redux reducer、requestId 竞态控制器。这些仍要在生产里遵守，只是当前按钮没跑它们。

## 什么时候用

多层嵌套、按业务 id 改一行、需要本地撤销时，用 produce 比手写多层 spread 更不容易漏分支。`articlesById` 加顺序列表会让更新路径更短。

`{ count }`、一次 `map`、只存在服务器上的列表、每帧数值，不必上 Immer。Redux Toolkit 的 `createSlice` 已经在 reducer 里启用 Immer，不要再包一层 `produce`。服务端缓存的主人是 TanStack Query。多人同时编辑用 Yjs，不要把 Immer Patch 当成 CRDT。

## 模型

```text
baseState
  → produce(base, recipe)
  → 同步 recipe 里的 Proxy draft
  → 改过的祖先路径复制，未改的子树保留原引用
  → nextState
```

没有语义变化时可以返回原引用。这只说明生产者没有制造新树，不保证 React 一定跳过渲染。

Draft 不是普通对象。不要把它交给 `setTimeout`、`fetch` 的回调、`postMessage`、IndexedDB 或另一份状态库。recipe 结束之后 draft 已经终结。调试时可以短时间 `current(draft)`，派生数据用结束后的 `nextState`。

`produce` 里要么改 draft，要么 `return` 一个替换值。两样一起做会冲突。`return undefined` 表示“没有返回值”，不是把状态设成 `undefined`。需要整体变成 undefined 时返回 `nothing`，并且类型允许。

`produceWithPatches` 在 `enablePatches()` 之后给出 `[next, patches, inversePatches]`。Patch 不是最小 diff，也不是授权过的远程命令。`path` 是数组。应用前要有版本、来源和路径白名单。

`enableArrayMethods()` 是 11.1 起的可选插件。`filter` 一类回调拿到的是原对象，在回调里赋值会直接改到 base。Lab 没有打开这个插件。

`setAutoFreeze` 改的是全局冻结行为。保持默认，除非有测量过的理由。

## 三层示例

### 基本

改分组名。recipe 写入 `draft.section.name`，空标题落到「未命名分类」，`revision` 增加。旧的 state 对象不会被原地改写；界面展示的是新快照。

### 业务

勾选按故事 `id` 翻转 `read`。查找用 `find`，不用数组下标当身份。未点到的那一篇应保持原引用，这是结构共享要在测试里断言的事，界面 JSON 看不出引用是否相同。

### 进阶

「生成乐观更新」插入 `optimistic-<revision>`。此时 ref 持有 inverse，控件锁定。「模拟失败并撤销」用 `applyPatches` 走 inverse。「确认本地变更」丢掉 inverse，不向任何服务器 POST。

研究包里的慢请求 / 快请求和 `requestId` 没有挂上。生产仍要在 await 之后再 `produce(latestState)`，并核对请求身份。只 abort 不够，因为对端可以忽略信号。

## 反例

### 反例 1：给 draft 参数重新赋值

```ts
produce(state, draft => { draft = { ...draft, revision: 2 } })
```

参数绑定换了，树没有改。

```ts
produce(state, draft => { draft.revision += 1 })
```

### 反例 2：又改 draft 又 return

```ts
produce(state, draft => { draft.revision += 1; return { revision: 9 } })
```

二选一。替换整棵树时只 return。

### 反例 3：await 期间握住 draft

```ts
produce(state, async draft => { await save(); draft.revision += 1 })
```

先拿到响应和下一次的 base，再同步 produce。Lab 的乐观更新在点击当次是同步的。

### 反例 4：回滚时再读 ref

```ts
setFeed(current => applyPatches(current, undo.current ?? []))
undo.current = null
```

updater 可能晚于清空。

```ts
const inverse = takeUndo(undo)
if (inverse) setFeed(current => applyPatches(current, inverse))
```

### 反例 5：用对象引用在 draft 数组里找下标

draft 元素和原始对象不是 `===`。按 `id` 找，或在只读场景用 `original`。

### 反例 6：把外部对象塞进 draft 后立刻改它

新对象不会自动变成 draft，改的是外部引用。先拷贝成纯数据，或在下一次 produce 里改。

### 反例 7：嵌套 produce 丢掉返回值

```ts
produce(draft.user, user => { user.name = 'A' })
```

内层结果要赋回去：`draft.user = produce(draft.user, ...)`，或者合成一次 recipe。

### 反例 8：在 Array Methods 回调里赋值

回调收到的是原对象。回调只做筛选，修改走 draft 上的路径。Lab 未启用该插件，开启前先审计。

### 反例 9：把远端 Patch 当权威

未校验的 path 可以越权。协作合并用 Yjs 或带版本的服务端事件，不用 inverse 覆盖别人的新写入。

### 反例 10：在 RTK reducer 里再 produce

`createSlice` 的 `state` 已经是 draft。直接改字段。再包一层会造成所有权混乱。

## 组合

**Query + Zod**：Zod 在网络边界裁掉多余字段。Query 拥有缓存。Immer 只在 `setQueryData` 里 produce 下一份值，并返回新对象。乐观更新要保存快照、在错误时按操作 token 回滚、在结束时失效。Lab 的 inverse 没有和 Query 的 revision 绑定。

**Redux Toolkit**：reducer 里直接改 draft。撤销若存在，只覆盖明确的本地 slice，并在远端快照替换时清空历史，避免旧 path 打到新形状上。

**Zustand**：`zustand/middleware/immer` 和手写 `set(state => produce(state, recipe))` 选一个。

## 生产核对清单

1. recipe 同步结束，没有把 draft 放进微任务。
2. 更新按业务 id，不用数组 index 当身份。
3. no-op 与未改分支的引用在测试里断言。
4. `enablePatches()` 在使用 patches 之前调用一次。
5. inverse 在进入 React updater 之前被同步取走。
6. 乐观锁定期的策略写明了：示例是整页锁定；产品可以改成按 id 锁定，但不能把旧 inverse 应用到新 revision。
7. 远端 JSON 先白名单重建，限制条数和字段长度。
8. 不把 Patch 日志里的敏感字段发到不可信通道。

## 升级

钉 `11.2.9`。从 v10 迁到 v11 时看官方 release：最终化流程有变，默认导入改为具名 `produce`。`enableArrayMethods()` 仍是可选步骤，不是升级必选项。

不要假设 Patch 的条数和顺序在版本之间不变。对比语义状态。Map/Set 要显式 `enableMapSet()`，并且 JSON 序列化自己写。

历史版本里有过原型相关修复与回滚记录。上线前看当前 tag 的安全说明，不要用未运行的 Demo 代替公告核对。

## 验收

- `toggleStory` 不修改入参；目标故事的 `read` 翻转；`revision` 增加。
- 改分组名只影响名称路径。
- 乐观插入后，`takeUndo` 得到的 inverse 能 `applyPatches` 回到插入前的故事列表。
- 连续两次回滚不会吃掉下一次乐观更新的 inverse。
- 锁定期间不能改名或勾选。
- `tests/sdk.test.mjs` 导入真实 `immer`。`patch-ownership` 单测不代替 SDK。无收据则 NOT_RUN。

练习：把手写 spread 改成 `produce`，断言未修改故事引用相同。再把“保存整棵 state 的撤销栈”改成有上限的 inverse，并在不兼容快照到达时清空栈。

## 资料

- https://immerjs.github.io/immer/
- https://immerjs.github.io/immer/produce/
- https://immerjs.github.io/immer/patches/
- https://immerjs.github.io/immer/pitfalls/
- https://immerjs.github.io/immer/return/
- https://immerjs.github.io/immer/async/
- https://immerjs.github.io/immer/map-set/
- https://immerjs.github.io/immer/performance/
- https://immerjs.github.io/immer/typescript/
- https://github.com/immerjs/immer/releases/tag/v11.2.9
