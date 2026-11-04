# TanStack Virtual 3.14.21｜滚动窗口要自己画

Lab 锁定 `@tanstack/react-virtual@3.14.21`（MIT）。`useVirtualizer` 只计算哪些下标该出现、它们的起点和总高度。滚动容器、绝对定位、业务键、测量和可访问性都由组件负责。它不缓存请求，也不知道 RSS 是否该被净化。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 调用真实的 `useVirtualizer`。`demo.tsx` 只做再导出。没有二维网格，没有 `localhost` 上的无限接口。

```tsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => viewport.current,
  getItemKey,
  estimateSize: () => 94,
  overscan: 5,
  useFlushSync: false,
})
```

- **basic**：8,000 条。滚动区高度 365，`overflowY: 'auto'`，`tabIndex={0}`。内层高度是 `getTotalSize()`。每一行 `position: absolute`，`transform: translateY(row.start)`，`ref={virtualizer.measureElement}`，`data-index={row.index}`，React key 是 `row.key`。
- **business**：3,400 条上再按分类和关键词过滤。提交时 [`filter-policy.mjs`](examples/filter-policy.mjs) 的 `normalizeFilterQuery` 做 NFC、去控制字符、最多 80 个码点。`viewIdentity(category, query, revision)` 用 `JSON.stringify` 而不是字符串拼接，避免边界碰撞。这个字符串作为 `VirtualList` 的 `key`。相同关键词再提交也会 `revision + 1`，从而丢掉旧测量。
- **advanced**：同一套过滤，加上按业务 ID 展开的长文本。展开按钮有 `aria-expanded`。`onChange` 只在 `isScrolling === false` 时把测量范围写进状态，避免滚动每一帧 `setState`。

`stableRowId` 在下标越界或 id 为空时抛错。不允许合成 `missing-index` 这种假键。

研究笔记里的横向 `horizontal: true` 列虚拟化、20 万格和语义分页表没有挂上。那是生产里要另做的可访问性出口，不是当前 DOM。

## 什么时候用

你要控制标记和滚动容器，行数已经让 `.map` 的 DOM 过重。行高变化频繁、希望库多管测量和锚点时，C09 的 Virtuoso 更省样板。完整表格用 C07，再决定要不要行虚拟化。几百行不必引入。

逻辑上的 8,000 条不是帧率，也不是内存上限。DOM 行数应接近视口加上 `overscan: 5`。

## 数据与模型

四个数要分开：

| 概念 | Lab 里是什么 |
| --- | --- |
| count | 当前过滤后的数组长度 |
| estimate | 94px，只用于还没量过的行 |
| measurement | `measureElement` 读到的真实高度 |
| key | `items[index].id`，不是 index |

`getScrollElement` 必须指向那个 `overflow: auto` 且有确定高度的节点。父级只有 `height: 100%` 而祖先高度未定，滚动不会发生，`getVirtualItems()` 会一直像第一屏。

内层占位若不设 `height: getTotalSize()`，滚动条长度是错的。行若不绝对定位到 `translateY(start)`，它们会叠在左上角。

`getItemKey` 用 `useCallback` 固定，并依赖当前 `items`。过滤之后数组变了，key 函数必须看新数组。用 index 当 key，展开集合会跟错行。

`useFlushSync: false` 是为了避开 React 19 在滚动测量里对 `flushSync` 的警告。关掉之后要在浏览器里看快速输入和滚动是否仍正确，不能只改这个布尔就当验收。

官方允许 `resizeItem` 或 `measureElement`。不要对同一行两套一起写，尺寸会打架。`directDomUpdates` 也没有打开。打开之后就不要再手写 transform 和内层高度。

动态高度下，`scrollToIndex` 使用对齐选项即可。大幅改高度后再要求 `smooth`，滚动距离会一边滚一边被纠正。Lab 的「跳转靠近末尾」没有开 smooth。

SSR 没有滚动容器。`initialRect` 只能做预估。本 Demo 没有服务端渲染，不能把 Vite 客户端当成水合已经对齐。

## 三层示例

### 基本

状态行应出现「数据 8000 条」和远小于 8000 的「DOM窗口」。滚轮移动后，范围数字变化。点「跳转靠近末尾」再「回到顶部」，窗口跟着走。若范围一直是初始化中，先查 ref 是否在第一次提交之后才可用，以及容器是否真的能滚动。

### 业务

选「工程实践」再输入关键词并提交。列表 key 变化，滚动回到新结果的顶部附近。组合期间 `composing` 为真，提交函数直接返回，URL 或查询状态都不变（本组件没有 URL）。把分类改掉但不按「筛选」，列表仍用上一次提交的 query；分类的 `<select>` 是立即 `setCategory` 的，所以分类会马上过滤。这是当前代码的行为：分类即时，关键词要提交。迁到产品里时应写成同一种提交策略，避免一半即时、一半延迟。

### 进阶

展开一行，长文本出现，下一行被推下去而不是重叠。收起后高度回来。快速跳到末尾再展开，测量应跟着 `data-index` 而不是跟着上一份筛选的下标。重复提交同一关键词，revision 增加，旧的展开 Set 在 `VirtualList` 内，key 一变组件重挂，展开状态会清空。这是示例用 key 换测量的代价。若产品要保留展开，把 `Set` 抬到 key 外面，并在 id 消失时删掉。

## 反例

### 1. key 用虚拟下标

```tsx
<div key={virtualRow.index} />
```

插入、排序、过滤之后测量缓存和展开状态错位。`getItemKey` 返回业务 id，React key 用 `row.key`。

### 2. 滚动区没有高度

```tsx
<div ref={viewport} style={{ height: '100%' }} />
```

祖先没有确定高度时，`scrollTop` 不动。Lab 写了 365px 和 `overflowY: 'auto'`。

### 3. 忘记总高度

行平移了，滚动条却只有一屏。内层 `height: virtualizer.getTotalSize()`。

### 4. 动态行没有 data-index 或 measureElement

展开后的高度不会写回这一行。两者都绑在行的根节点上。

### 5. estimateSize 过小

估 20px、真实 300px，跳转后位置会漂。先给偏大的估计，再让测量纠正。不要改成写死的像素来「消掉」跳动。

### 6. overscan 设成几百

为了不闪而把 DOM 几乎全部挂上。从 4 到 8 开始，用真实节点数调整。Lab 是 5。

### 7. 用 virtualItem.index 当 cursor

请求层保存服务端游标。虚拟器只有当前数组的下标。

### 8. 只 abort 不换 view identity

旧测量和旧滚动会留在新关键词上。`viewIdentity` 带 revision。

### 9. resizeItem 和 measureElement 一起用

同一行两个主人。Lab 只用测量 ref。

### 10. directDomUpdates 再手写 transform

布局所有权重叠。选定一种。

### 11. 数据卸载就以为读屏器也能访问全部行

滚动容器虽然能聚焦，未挂载的文章仍然不在无障碍树上。长列表要另给分页的原生内容，或明确只保证窗口内可读。

### 12. 缺 id 时编一个 missing-index

`stableRowId` 选择抛错。静默键会把两行合成一个，测量更难查。

## 组合

**Query。** 无限查询拥有页、错误和 `signal`。Virtual 接收 flatten 后的只读数组。触底调用 `fetchNextPage`。queryKey 包含分类、规范化关键词和排序。本 Demo 的 3,400 条是一次性 `useMemo`，没有这一层。

**Table + RHF。** 表负责列和 `getRowId`。虚拟器负责行窗口。被卸载的输入不能是草稿的唯一副本。服务端分页和客户端虚拟化不要对同一批数据各排一次序。官方有表格示例，本文件没有接入。

**DOMPurify。** 标题和摘要是文本。若要渲染 RSS HTML，净化在进入虚拟行之前完成。

## 生产清单

- 滚动容器有高度、`overflow` 和 `overscrollBehavior: 'contain'`。
- 行有 `data-index`、测量 ref、业务 key、`translateY`。
- 过滤和重复提交都会换 `viewIdentity`。
- 滚动过程中不要每个像素 `setState`。Lab 只在停下时更新范围。
- 展开控件有 `aria-expanded`。区域有名字。
- 不要把 8,000 写成性能指标。用目标设备的 DOM 数量和长任务来判断。
- 裁剪已加载数组之前，先定滚动锚点。否则 index 和测量一起错。

## 升级

3.14 的 React 适配器使用 `useVirtualizer` 和 `getItemKey`。不要从 Virtuoso 复制 `computeItemKey`。升级后看 `useFlushSync` 的默认值是否还需要关掉，并在浏览器里滚一次变高列表。

## 练习

1. 数一下首屏 DOM 行，确认接近窗口而不是 8,000。
2. 展开一行再过滤，展开状态不得出现在另一个 id 上。
3. 连续两次提交同一关键词，测量范围回到新列表的开头，而不是停在旧偏移。
4. 把 `getTotalSize` 拿掉，确认滚动条变短；再加回来。
5. 给缺 id 的行调用 `stableRowId`，确认抛错而不是生成假键。

## 官方链接

- https://tanstack.com/virtual/latest
- https://tanstack.com/virtual/latest/docs/framework/react/examples/table
- https://github.com/TanStack/virtual

## 证据

`filter-policy` 单测不创建 virtualizer，也不能证明滚动。sdk 要真实 import `@tanstack/react-virtual@3.14.21` 并在 `docs/library-lab/evidence/runs/` 留下收据。browser 看测量和跳转。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C10 的条目 PASS。不要改 `verification.json`。
