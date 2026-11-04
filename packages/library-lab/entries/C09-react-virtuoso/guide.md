# React Virtuoso 4.18.19｜变高列表只少挂 DOM

Lab 锁定 `react-virtuoso@4.18.19`（MIT）。Virtuoso 测量变高行并只挂载窗口内的 DOM。它不减少你已经创建的 JS 数组，不发请求，也不提供表格语义。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 按 level 渲染三个真实 `<Virtuoso>`。`demo.tsx` 只做再导出。没有独立 Vite 工程。

- **basic**：10,000 条变长摘要。`defaultItemHeight={86}`。`computeItemKey` 返回 `article.id`。`scrollToIndex({ index: 9000, align: 'center' })`。`rangeChanged` 把可见区间写进 `role="status"`。
- **business**：630 条里先按关键词过滤，再只把前 `limit` 条交给 Virtuoso。`endReached` 和按钮都走 `loadMore`。260ms 定时器模拟等待。generation 对不上就不再 `setLimit`。搜索提交 [`view-policy.mjs`](examples/view-policy.mjs) 的 `normalizeFeedQuery`（NFC、去掉控制字符、最多 80 个码点）。`key={viewRevision}` 在每次提交时增加，即使查询词相同也丢掉旧的滚动位置。组合期间不提交。
- **advanced**：`firstItemIndex` 从 100000 起。前插 10 条时，新的 `firstItemIndex` 和更长的 `items` 在同一次 `setState` 里更新。`followOutput` 只在已经贴底时为 `'auto'`。展开用业务 ID 存在 `Set` 里，并插入多行文本迫使重测高度。

`nextWindowLimit` 拒绝负数和非安全整数。`nextViewRevision` 拒绝把 revision 加过 `MAX_SAFE_INTEGER`。

`TableVirtuoso`、Query 无限滚动和 DOMPurify 没有挂载。

## 什么时候用

行高不固定、要保持滚动位置的消息流和文章流。行高固定、要自己控制 DOM 时用 C10。需要列、键盘网格和企业编辑时用 C07 或 C08。几百行的静态列表不必虚拟化。

虚拟化之后，屏幕阅读器默认读不到未挂载的行。关键数据要另有可分页的语义列表，或接受这个取舍并写进产品说明。

## 数据与模型

`data` 是当前要展示的数组。`computeItemKey` 必须稳定，不能用数组下标。前插时如果 key 跟着 index 走，展开状态和测量会串行。

`firstItemIndex` 告诉库：数组第 0 项在整个逻辑列表里的下标是多少。前插时把它减去新增条数，并同时换掉 `data`。分两次 setState 会先跳滚动位置。

`followOutput` 返回 false 时，用户正在看历史，新消息不把他拽到底。Lab 用 `atBottomStateChange` 记录这一点。

`endReached` 会在短列表上反复触发。`pending` ref 和 `hasMore` 挡住重入。错误发生时不要自动再调 `loadMore`，否则会打成请求环。本示例没有错误分支的 HTTP，只有定时器。

过滤或语言一变，旧的测量不能留给新数组。Lab 用 `key={viewRevision}` 换掉整个列表。不要把上一轮的 `initialMeasurementsCache` 无条件塞回来。

10,000 是逻辑条数。DOM 节点数应接近视口加 overscan，而不是 10,000。没有 Performance 记录就不能写帧率。

## 三层示例

### 基本

打开后状态行出现可见范围，而不是 1–10000。点「跳至第 9001 条」，范围应靠近 9001。文本长度随 `index % 8` 变化，行高不应被写成一个固定像素。

### 业务

组合中文时状态写「不会提交搜索」。结束后再点搜索，列表 key 变化，窗口回到前 30 条。滚到底或点按钮，260ms 后增加最多 30 条，且不超过过滤后的总数。搜索词在等待期间被换掉时，旧定时器不能把 limit 加到新结果上。

### 进阶

点「向前加载 10 条」。已有消息的 `article-N` 不变，窗口起点减少。贴底时「添加最新消息」会跟着到底；先往上滚，状态变成「正在阅读历史」，再追加不应强制滚动。展开后行变高，下一项仍从新的测量位置开始，而不是叠在长文本上。

## 反例

### 1. key 用 index

```tsx
computeItemKey={(index) => index}
```

前插后展开状态落到别的文章上。用 `article.id`。

### 2. 前插只改数组

不减 `firstItemIndex`，视口会跳。两个字段同一次更新。

### 3. followOutput 恒为 auto

用户翻历史时被新消息拽走。Lab 的回调先看是否贴底。

### 4. endReached 没有门闩

短列表和 StrictMode 会连续加载。用 `pending`、generation 和「已经没有更多」。

### 5. 同名查询复用旧滚动

第二次搜索相同关键词仍停在上次的末尾。`nextViewRevision` 即使查询相同也要变，并作为 Virtuoso 的 `key`。

### 6. 把虚拟下标当后端 cursor

`range.endIndex` 不是服务器游标。游标由接口返回。裁剪已加载数组会改变 index，必须同时改锚点。

### 7. 用 Virtuoso 代替表格可访问性

未挂载行对读屏器不可见。不要声称 10,000 条都能被线性朗读。需要时另给分页 `<table>`。

### 8. 把 HTML 摘要直接插入

fixture 是纯文本。真实 RSS 正文先净化，再决定能不能作为 HTML。虚拟化不净化字符串。

## 组合

**Query。** `useInfiniteQuery` 拥有页和 `signal`。Virtuoso 只接收已经 flatten 的只读数组，并在 `endReached` 里调用 `fetchNextPage`。queryKey 包含筛选条件。本 Demo 用本地数组代替了这一层。

**Table。** `TableVirtuoso` 才能和表头、行一起虚拟化。当前组件是普通 `Virtuoso`。列排序仍属于 TanStack Table 或 AG Grid，不要在 item 渲染器里自己排整个 10,000 数组还以为只有 DOM 被排序。

**DOMPurify。** 只有要把可信策略之后的 HTML 放进文章时才需要。现在的 `summary` 是文本节点。

## 生产清单

- `computeItemKey` 使用业务 ID。
- 前插同时更新 `firstItemIndex` 和 `data`。
- 查询变化换新的 view revision，不复用测量缓存。
- `endReached` 有并发门闩和 generation。
- 给滚动容器一个确定高度。Lab 是 360–390px。
- 展开按钮有 `aria-expanded`。加载文案在 `role="status"`。
- 不要为了读屏器一次挂载全部行。另给非虚拟入口。
- 卸载时增加 generation 并清掉定时器。

## 升级

4.18 的列表用 `computeItemKey`，不要写成 C10 的 `getItemKey`。升级后回归：跳到 9000、前插不跳、贴底跟随、展开重测。可变行高若改用函数，在目标浏览器里看滚动条是否抖动，不要凭估计像素承诺。

## 练习

1. 跳到第 9001 条，可见范围包含该条，DOM 节点数远小于 10,000。
2. 前插之后，原来的 `article-501` 仍展开或仍折叠，不串到新行。
3. 搜索 A 的加载尚未返回时改成 B，A 的 limit 不加到 B 上。
4. 不在底部时追加消息，滚动位置保持。

## 官方链接

- https://virtuoso.dev/
- https://github.com/petyosi/react-virtuoso

## 证据

`view-policy` 单测不挂载 Virtuoso，也不能证明滚动和测量。sdk 要真实 import `react-virtuoso@4.18.19` 并在 `docs/library-lab/evidence/runs/` 留下收据。browser 单独计。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C09 的条目 PASS。不要改 `verification.json`。
