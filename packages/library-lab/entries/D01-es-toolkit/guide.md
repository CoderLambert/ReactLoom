# es-toolkit 1.52.0｜RSS 流水线、稳定去重和输入边界

Lab 锁定 `es-toolkit@1.52.0`（MIT）。新 TypeScript 代码从 `es-toolkit/array`、`es-toolkit/object`、`es-toolkit/function`、`es-toolkit/promise` 按需导入。它是通用数据变换库，不负责 schema、鉴权、HTTP 缓存、金额或持久队列。

没有与本条目指纹匹配的收据时，sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 个测试、45 个 Playwright，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 只重导出 [`examples/example.tsx`](examples/example.tsx)。面板跑的是这份 React 源码，种子是本地 fixture，不访问 RSS 网络。

`canonicalUrl` 只接受 `http:` / `https:`，清空 hash，删除以 `utm_` 开头以及 `fbclid`、`gclid` 的查询参数，再排序剩余参数。`id=42` 这类业务参数留下。`normalizeArticle` 要求对象、非空标题、可解析日期，并把来源收成 `official | community | other`。

`makeDigest` 要求 `pageSize` 是 1–100 的安全整数。每条输入单独 `try/catch`，失败记 `{index, reason}`，其余继续。合格记录先 `orderBy`（发布时间降序、URL 升序），再 `uniqBy` 规范化 URL，然后 `groupBy` 来源，最后 `chunk` 分页。

- basic：分组计数和第一页。
- business：输入条数、去重后条数、分页结果。同 URL 的旧稿被丢掉，留下较新的一篇。
- advanced：勾选后注入 `javascript:` 和 `{foo:1}`，它们进 `rejected`，不冲掉已接受的文章。

下面仍写 `debounce`、`limitAsync`、`pick`、`cloneDeep` 和 `es-toolkit/compat`。这些是迁出去之后会用到的 API，当前示例没有挂载它们。

## 什么时候用

| 任务 | 用它 | 换别的 |
| --- | --- | --- |
| 列表去重、分组、排序、分批 | `uniqBy` / `groupBy` / `orderBy` / `chunk` | 一次 `map/filter` 用原生数组 |
| 搜索防抖、滚动节流 | `es-toolkit/function` 的 `debounce` / `throttle`，选项是 `edges` | 数据新鲜度交给 TanStack Query |
| 小规模并发上限 | `limitAsync` | 优先级、暂停、区间限额用 D04 p-queue；只要并发帽用 D03 p-limit |
| 从 Lodash 迁出 | 先评估 `es-toolkit/compat`，逐个回归 | 已稳定且没有收益的调用留在 D02 |
| 金额 | 不用 `sum` / `round` 当账本 | D05 decimal.js，服务端复算 |
| 状态、缓存、本地库 | 它不拥有生命周期 | Zustand、Query、Dexie 各管各的 |

新 TS 项目缺一组可读的集合函数时值得评估。不要为了“统一工具”把三行原生代码包进黑盒 `utils.ts`。

## 模型

### `uniqBy` 留的是第一项

```ts
import { uniqBy } from 'es-toolkit/array'
uniqBy([{ id: 1, v: 'old' }, { id: 1, v: 'new' }], row => row.id)
// [{ id: 1, v: 'old' }]
```

同一投影键保留先出现的元素。Lab 要留最新文章，所以先 `orderBy` 再 `uniqBy`。并列时间用 URL 做次级排序，避免结果跟着输入抖动。

### `groupBy` 得到对象

返回 `Record<key, Item[]>`。分组键进入对象属性名之前先收成受控枚举。Lab 把未知来源写成 `other`，再显式填 `official` / `community` / `other` 三个数组。外部字符串若必须原样保留，用 `Map`，不要拿它当 ACL 或文件路径。这是输入边界，不是对库实现的漏洞声明。

### `debounce` 管的是调用时刻

主入口是 `debounce(fn, delayMs, { edges: ['trailing'], signal? })`，返回值有 `cancel()`、`flush()`、`schedule()`。选项形状和 Lodash 的 `{ leading, trailing, maxWait }` 不同。`cancel` 只取消还没开始的那次调用。回调里的 `fetch` 已经发出后，还要 `AbortController` 和代际号。组件卸载两样都清。

### `limitAsync` 管的是同时运行数

```ts
import { limitAsync } from 'es-toolkit/promise'
const limited = limitAsync(async (id: string) => getItem(id), 3)
const results = await Promise.allSettled(ids.map(id => limited(id)))
```

并发 3 表示同一时刻最多 3 个回调在执行。它不是每秒 3 次，不重试，不缓存，不看优先级。函数若忽略 `AbortSignal`，限流器停不掉已经开始的 I/O。一次 `map` 会为全部输入创建 Promise；量很大时按窗口生产，或改用队列。

### 两套导入约定

新代码：`import { debounce } from 'es-toolkit/function'`。存量 Lodash：研究 `es-toolkit/compat`，回归 `maxWait`、路径读写、`undefined` 和稀疏数组。兼容层不覆盖 `_(arr).map().filter()` 链式包装。全局把 `lodash` 替换成 `es-toolkit` 会改语义。

## 三层示例

### 基本

点「运行真实工具函数」。`groupBy` 按受控来源计数，`chunk` 按所选页大小切第一页。页大小来自 1、2、3、5 的选择框，仍经过 `makeDigest` 的 1–100 预检。

### 业务

同一规范化 URL 出现两篇时，输出里的 `unique` 小于 `input`。留下的是发布时间较新的那篇，因为排序在去重之前。`id=42` 与 `id=43` 仍是两篇文章。

### 进阶

打开坏输入后，`javascript:` 和缺字段对象进入 `rejected`，并带上原数组下标。其余文章照常分组。预览里的 `canonical` 演示去掉 `utm_source` 后仍保留 `id=42`。

原始研究包里的 `src/01-basic.ts`、`src/async.ts`、`npm run demo:async` 没有挂进 Lab。活动列表的 `pick` 白名单、`limitAsync` 批处理和可取消搜索仍是下面的生产写法，不要把当前按钮当成那些能力已经跑过。

## 反例

### 反例 1：先去重再排序

```ts
const unique = uniqBy(articles, article => article.url)
const newest = orderBy(unique, [article => Date.parse(article.publishedAt)], ['desc'])
```

留下的是先到的旧稿。正确顺序：

```ts
const newest = orderBy(accepted, [article => Date.parse(article.publishedAt), article => article.url], ['desc', 'asc'])
const unique = uniqBy(newest, article => article.url)
```

Lab 的 `makeDigest` 用的是后一种。若产品要留最后到达的一条，写明另一条规则，不要把“最新”和“先到”说成同一件事。

### 反例 2：用标题当主键

```ts
uniqBy(items, item => item.title)
```

同名不同文会被并成一条。用规范化 URL，或 URL 加租户。服务端仍要有自己的唯一约束。

### 反例 3：清空全部 query

```ts
url.search = ''
```

`?id=42` 和 `?id=43` 会变成同一篇文章。只删已知追踪参数。

### 反例 4：防抖代替取消

```ts
const search = debounce(async query => setData(await fetchData(query)), 250)
```

慢响应仍会盖住新关键词。计划调用用 `cancel()`，进行中的请求用 `AbortSignal`，回写前对代际。

### 反例 5：把并发帽当成速率

```ts
const fetchLimited = limitAsync(fetchItem, 5)
```

这是最多 5 个同时跑，不是每秒 5 次。分钟配额用带 `intervalCap` 的队列，并且每次 HTTP 尝试单独入队。

### 反例 6：`pick` 当权限边界

```ts
const response = pick(privateUser, ['name', 'email'])
```

客户端字段映射不能代替服务端授权。展示合同在 API 出口先裁好。

### 反例 7：每次按键 `cloneDeep` 整棵状态

深拷贝不提供结构共享，也不校验输入。局部更新用不可变写法或 D06 Immer。`cloneDeep` 只用于确实需要独立副本、并且理解 Map、类实例和函数不会按你想的那样复制的时候。

### 反例 8：`chunk` 当请求池

`chunk(ids, 10)` 只是切数组。十个请求仍会一起启动。异步上限用 `limitAsync` 或 p-limit，并单独设计取消。

## 组合

**TanStack Query**：Query 拥有缓存键、重试和失效。es-toolkit 放在 `select` 或转换函数里做分组。不要把同一份列表再存进 Zustand。搜索条件进 queryKey；`debounce` 只决定何时改这个条件。

**Zod**：不可信 JSON 先 `safeParse`。合格记录才进入 `makeDigest`。失败行隔离，不把缺标题压成空字符串。Lab 用的是手写 `normalizeArticle`，没有装 Zod。

**p-queue**：只有并发上限时不必上队列。出现暂停、优先级、窗口限额或积压观测，调度交给 D04，es-toolkit 继续做纯变换。

## 生产核对清单

1. 去重键在排序之后计算，并写明保留的是最新、最先还是最后到达。
2. URL 协议白名单、追踪参数白名单、业务参数保留，三者分开测试。
3. 分组键是枚举或 `Map`，未知来源不会变成动态配置键。
4. `pageSize`、批量长度、错误原因长度都有上限；错误不回显原文和密钥。
5. 防抖卸载调用 `cancel()`；请求卸载调用 `abort()`；回写核对代际。
6. `limitAsync` 与速率限额不要混成一个数字。
7. 大列表的排序放在渲染之外，必要时进 Worker。`async` 函数本身不启用多核。
8. 按 `es-toolkit/array` 这类子路径导入后，用真实产物看 tree-shaking，不引用官网的体积口号当本页预算。

## 升级

固定 `1.52.0`，不要为了演示升到下一个 minor。`compat` 在 1.51 / 1.52 仍有 Lodash 边缘修复，升级后用真实调用回归，不要把兼容层文档读成 100% 行为一致。

从 Lodash 迁出时逐项对照：`debounce` 选项、`get` 对 `0` / `null` 的默认值、`merge` 的数组语义、`cloneDeep` 与 `structuredClone`。D02 的 Lab 示例仍使用 `lodash-es@4.18.1`，两条目不要同时包进同一业务路径却不测。

浏览器支持以官方矩阵和目标用户版本为准。SSR 里这些函数不碰 DOM，但仍要在目标运行时跑一次。

## 验收

- 同规范化 URL 留发布时间较新的一篇；`id` 不同则都留。
- `utm_*`、`fbclid`、`gclid` 去掉，业务 `id` 留下，hash 丢掉。
- `javascript:`、缺标题、坏日期、非对象进入 `rejected` 并带 index。
- 非法 `pageSize` 抛 `RangeError`，不产出半截摘要。
- `tests/sdk.test.mjs` 用真实 `orderBy`、`uniqBy`、`groupBy`、`chunk` 断言“最新键留下”和分块形状。测试文件存在不等于 sdk PASS。
- 浏览器里点三层按钮，确认输出与种子一致。本指南没有把这次点击写成已完成的浏览器收据。

练习：同一 URL 来自两个订阅源时，分别实现“全局留最新”和“按源保留”。`?id=1` 与 `?id=2` 不能被并成一条。第二项是 50 个任务里中途 `abort`：未启动的失败，已启动的合作式停止，旧结果不回写。

## 资料

- https://es-toolkit.dev/
- https://es-toolkit.dev/usage.html
- https://es-toolkit.dev/reference/array/uniqBy.html
- https://es-toolkit.dev/reference/array/orderBy.html
- https://es-toolkit.dev/reference/array/groupBy.html
- https://es-toolkit.dev/reference/array/chunk.html
- https://es-toolkit.dev/reference/function/debounce.html
- https://es-toolkit.dev/reference/promise/limitAsync.html
- https://es-toolkit.dev/reference/object/pick.html
- https://es-toolkit.dev/compat/intro.html
- https://es-toolkit.dev/browser-support.html
- https://github.com/toss/es-toolkit/releases/tag/v1.52.0
