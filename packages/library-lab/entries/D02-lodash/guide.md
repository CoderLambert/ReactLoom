# lodash-es 4.18.1｜先到先留的去重、分组排序和可取消防抖

Lab 只锁定 `lodash-es@4.18.1`（MIT）。现代 Vite / React 工程用具名导入。`lodash` 的 CommonJS 构建是同一 API 家族的另一种发行，本条目没有同时安装它，也不要为了对照再打进一份。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。数据是七条本地 `Feed`，没有 HTTP。

`buildDigest` 先 `uniqBy(source, 'id')`，再 `groupBy` 分类，组内 `orderBy(['score','id'], ['desc','asc'])`，组按数量降序、分类名升序，最后 `chunk(unique, 3)`。`id: 'ai'` 在种子里出现两次，留下的是数组里的第一条「模型推理实践」（分数 81），后面的「旧版重复记录」（分数 17）被丢掉。这是 `uniqBy` 保留先出现元素的语义，不是“保留最高分”。

advanced 用 `debounce(..., 250)`。输入在非组合态才进入计时器；`compositionstart` 会 `cancel()`；`compositionend` 立刻写入已应用查询。卸载时 `schedule.cancel()`。「立即应用」调用 `flush()`。过滤发生在已经去重的标题上，用 `toLocaleLowerCase`，不发请求。界面写明：`cancel` 不会自动处理业务请求的 `AbortSignal`。

没有挂载的生产内容：`get` / `merge` / `cloneDeep` / `keyBy` / `template`、CJS `require('lodash')`、URL 规范化、服务端 path 白名单。D01 才做“先排序再去重以留最新”。

## 什么时候用

历史代码已经大量调用 Lodash，或需要这套稳定语义：`groupBy`、`orderBy`、`uniqBy`、`debounce` 的 `leading` / `trailing` / `maxWait`。新项目若只要少量现代工具，先和 D01、原生 `Object.groupBy` 比较产物体积，再决定是否引入。

不要用它做：分布式缓存（`memoize` 不懂 staleTime）、请求取消（`debounce` 只清计时器）、并发池（`throttle` 不是 p-limit）、HTML 清洗（`template` 和 `escape` 都不是 sanitizer）、金额。

`lodash` 与 `lodash-es` 不是两套产品。CJS 老项目用 `lodash`；ESM 打包用 `lodash-es`。一个应用选一种，避免两份打进产物。类型包分别是 `@types/lodash` 与 `@types/lodash-es`，Lab 的 `library.json` 只钉运行时 `lodash-es`。

## 模型

### 去重、排序、分组、索引

`uniqBy(rows, 'id')` 保留第一次命中。想留最新 RSS，要先把时间规范成可比较的值，再降序 `orderBy`，然后 `uniqBy`。Lab 故意不这样做，用来把“先到”展示清楚。

`orderBy(collection, iteratees, orders)` 要写明每个键的方向。`sortBy` 默认升序。ISO 时间字符串只有在同一规范下才能当排序键。

`groupBy` 的每个键是数组。`keyBy` 的同键后者覆盖前者。Lab 的分类是种子里的 `'tech' | 'business' | 'news'`，不是外部任意字符串。不稳定 ID 先查重，不要靠 `keyBy` 沉默覆盖。

### `get`、`cloneDeep`、`merge`

`get({count:0}, 'count', 9)` 得到 `0`。`null` 不会触发默认值。`|| default` 会吞掉 `0`、`false` 和空字符串。

`cloneDeep` 复制常见嵌套结构，等于快照，也等于校验。函数和部分宿主对象要单独看。React 状态优先不可变更新或 Immer。跨 Worker 的可克隆值用 `structuredClone`。

`merge(target, source)` 修改 target。数组按索引混合：`merge({list:[1,2,3]}, {list:[9]})` 得到 `[9,2,3]`。配置叠层要先决定数组是替换、追加还是按下标合并。

### 防抖和节流

`debounce(fn, wait, {leading, trailing, maxWait})` 在停止触发后再跑，有 `cancel` 和 `flush`。它不返回每次触发各自的 Promise，也不取消进行中的网络。

`throttle` 限制触发频率，仍不是并发池。搜索取消分三层：`debounced.cancel()`、`AbortController.abort()`、代际号丢掉已经无法取消的旧回包。

Lab 只实现了第一层，加上 IME：组合期间取消计时器，组合结束直接应用当前值。

### 4.18 的安全边界

4.17.21 不能再当安全基线。`_.unset` / `_.omit` 的原型链删除，以及 `_.template` 在不可信 `imports` 键上的注入，要看到 4.18.0 才覆盖已披露路径；4.18.1 再修模块化构建里 `template` / `fromPairs` 的 `ReferenceError`。`lodash` 与 `lodash-es` 都在影响范围内。

升级后仍要白名单化用户 path：限制深度和长度，拒绝 `__proto__`、`prototype`、`constructor`。`template` 只编译开发者常量。展示不可信 HTML 用专门 sanitizer。锁文件里的 `lodash.*` 独立模块也要核对，顶层版本不够。

## 三层示例

### 基本

页面直接渲染摘要：原始 7 条，去重后的 id 列表，以及按 3 条一批的批次数。对照种子，`ai` 只出现一次，且是第一条。

### 业务

分组 JSON 里每个分类有 `count` 和已排序的 `items`。组内分数降序，分数相同再按 id 升序。分类键来自种子类型，不是用户输入。

### 进阶

搜索框关联 `d02-query`。停手约 250ms 后「已应用」更新，「合并提交次数」增加。组合输入期间次数不该跟着拼音跳。清空会 `cancel` 并清掉查询。离开示例时 effect 清理计时器。

原始研究里的 `src/02-feed.ts` URL 管道和 `src/03-search.ts` HTTP 代际没有挂载。那些规则仍要在生产里写，只是不能把当前 `<output>` 当成已经测过它们。

## 反例

### 反例 1：去重后再排序，口头说成留最新

```ts
const ranked = orderBy(uniqBy(articles, 'url'), ['publishedAt'], ['desc'])
```

排序只影响留下来的那一条的位置，换不回被丢掉的新稿。

```ts
const ranked = uniqBy(orderBy(normalized, ['publishedAt', 'id'], ['desc', 'asc']), 'url')
```

Lab 的 `buildDigest` 选择展示第一种语义里的“留第一条”。迁到 RSS 时改成第二种，并加测试。

### 反例 2：外部字段直接 `groupBy` / `keyBy`

奇异键和重复 id 会进对象。先白名单，重复 id 报错。危险键用 `Map`。

### 反例 3：`merge` 当覆盖配置

```ts
merge(config, incoming)
```

target 被改，数组按索引混合。

```ts
const next = { ...config, list: incoming.list }
```

数组语义写在类型旁边。不要对 React state 原地 `merge`。

### 反例 4：`get(obj, path, fallback) || fallback`

`0` 会被换成 fallback。缺省用 `??`，或在确认 `null` 也算缺省时单独写。

### 反例 5：只防抖、不取消请求

Lab 的 250ms 计时器可以 `cancel`。一旦 `flush` 或回调里发出 fetch，还要 signal 和代际。界面上的那句提示就是这条边界。

### 反例 6：用 `throttle` 限制 HTTP 并发

触发变稀，飞行中的请求数照样涨。并发交给 p-limit / p-queue。

### 反例 7：用户字符串进 `_.template`

只编译常量模板。用户文本转义或净化，不编译。

### 反例 8：`cloneDeep` 当校验或清洗

它不拒绝 `javascript:` URL，也不去掉密钥。校验在拷贝之前。

## 组合

**Query + Zod**：Zod 校验未知 JSON，Query 持有服务端缓存和取消，lodash-es 只做展示层排序分组。不要在 Lodash 里再养一份长期缓存。

**p-limit + Dexie**：去重后的 id 再用有上限的并发去拉，结果写入带版本的 IndexedDB。`keyBy` 不是数据库唯一约束。

**React Hook Form**：白名单路径可以用 `get` 显示错误。用户自定义字段名不能丢进 `set`。动态行不要每个按键深拷贝整张表。

## 生产核对清单

1. 锁文件里的 `lodash`、`lodash-es` 和 `lodash.*` 都不低于已修复的 4.18 线；本 Lab 钉的是 `lodash-es@4.18.1`。
2. 用户 path 有深度、长度和禁用键。
3. 去重保留规则写在测试名里：第一条，或排序后的最新一条。
4. IME：`compositionstart` 取消待触发调用，`compositionend` 再提交。
5. 卸载调用 `cancel()`；有网络时再 abort，并丢掉过期回包。
6. 搜索框有 label，结果区在应用后更新；加载和错误用可读状态，不只靠颜色。
7. 万级列表不要在渲染路径上全量 `cloneDeep`。
8. 产物里确认只有一份 Lodash 发行。

## 升级

不要为了教程留在 4.17.21。4.18.0 覆盖本轮已披露的原型链与模板问题，4.18.1 修构建回归。升级后跑真实调用：`uniqBy` 顺序、`merge` 数组、`debounce` 的 `maxWait`、`template` 仅常量。

从 CJS `require('lodash')` 迁到 `lodash-es` 时，用同配置比较产物和依赖图。语义要对拍，不凭“ESM 一定更小”签收。

若目标是新的严格类型工具函数，评估 D01，逐个 API 对照空值和迭代器，不要机械替换。

## 验收

- 重复 `ai` 只留种子中的第一条，分数 81，不是 17。
- 组内 `orderBy` 分数降序、id 升序；`chunk` 批大小为 3。
- 防抖 250ms 合并输入；`flush` 立即应用；`cancel` 与卸载不再触发待执行调用。
- 组合输入期间不把未完成的拼音推进已应用查询。
- `tests/sdk.test.mjs` 覆盖真实 `lodash-es` 的去重、分组排序、`debounce` 的 `flush` / `cancel`。未记录收据则不是 sdk PASS。
- 浏览器里切换三层，确认 basic 的 id 列表、business 的分组和 advanced 的取消。本页没有把该点击写成浏览器收据。

练习：把模拟过滤换成可取消的本地 HTTP，覆盖慢响应后到、卸载后完成、IME、429 和超时。分别断言计时器取消、abort 和代际。

## 资料

- https://lodash.com/docs/4.18.1
- https://github.com/lodash/lodash
- https://github.com/lodash/lodash/releases
- https://www.npmjs.com/package/lodash-es
- https://github.com/lodash/lodash/security/advisories/GHSA-f23m-r3pf-42rh
- https://github.com/lodash/lodash/security/advisories/GHSA-r5fr-rjxr-66jc
- https://www.npmjs.com/package/@types/lodash-es
- https://www.npmjs.com/package/@types/lodash
