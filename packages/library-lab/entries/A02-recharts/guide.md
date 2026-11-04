# Recharts 3.10.1｜从简单 React 图表到可维护的数据分析工作台

Lab 锁定 `recharts@3.10.1` 与 `react-is@19.3.0`（与仓库 React 19.3.0 对齐），许可证 MIT。官方安装要求 `react-is` 主版本跟 React 走。研究稿里写过的 `react-is@19.2.8` 不是本仓库的 pin，迁移时不要降回去。

没有逐库收据时，sdk / build / browser 保持 NOT_RUN。Actions [41779873259](https://github.com/CoderLambert/ReactLoom/actions/runs/41779873259) 是仓库级安装、typecheck、构建和已有测试，不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 调用真实 Recharts 组件。[`examples/chart-policy.ts`](examples/chart-policy.ts) 负责窗口和刷新预算。[`examples/demo.tsx`](examples/demo.tsx) 只重导出。

示例实际做了这些事：

- 父级给定 `height: 300`、`minWidth: 0`，`ResponsiveContainer` 使用 `debounce={60}`。
- basic：`BarChart` + `Bar dataKey="reads"`，`YAxis allowDecimals={false}`，下面有同等含义的表。
- business / advanced：`ComposedChart`。阅读和收藏走 `yAxisId="count"`，收藏率走右侧 `yAxisId="percentage"`（0–100，单位 %）。advanced 可关掉收藏率。
- 窗口天数经 `normalizeWindow` 收到 3–14。输入框允许暂时不是合法数字，blur 时写回当前合法值。
- `nextRevision` 把刷新次数封在 `MAX_REVISION = 1000`。`sampleRows` 是确定性本地数据，不请求网络。

当前示例**没有**挂载 `syncId` / `syncMethod`、`Brush`、移动平均、`connectNulls`、频道切换的 `AbortController`，也没有把缺失值留成 `null`（样例里的阅读和收藏都是算出来的正数）。下面第 4、5 节是生产教学。照着写进业务代码，不要以为 Lab 页面已经演示了同步和竞态。

## 1. 什么时候用

Recharts 用 React 组件和 SVG 声明图表，尺度计算借 D3 的模块。你写 `<LineChart>`、`<XAxis>`、`<Tooltip>`、`<Line>`，生命周期跟着 React，而不是 ECharts 那种 `init` / `dispose`。

| 要交付的工作 | 建议 | 原因 |
| --- | --- | --- |
| 运营页上几张可定制的趋势图 | 优先在目标数据量上验证 Recharts | 组合方式和主题跟 React 一致 |
| 大量图表类型、坐标系不统一 | 同时做一版 ECharts（A01） | Recharts 不保证复杂类型开箱即用 |
| 上万到数十万点的时序 | 先测 uPlot（A04） | SVG 节点和交互成本要用真实数据看 |
| 任意几何 | D3（A05） | 自由度更高，坐标和图例也归你 |
| 一个数字旁边的迷你趋势 | 原生 SVG | 不必引入整套图表 |
| 明确要 Canvas | ECharts 或 Chart.js | Recharts 的核心是声明式 SVG |

它不是地图、节点编辑器或 BI 引擎。外部底图和图标的许可与图表库无关。

v3 迁移指南写的最低线是 React 16.8+、TypeScript 5+、现代语法目标。本仓库用 Node 22 和 React 19.3。移植到 Next.js 时图表放在客户端边界，SSR 首屏量不到容器尺寸，要单独验收 hydration。

## 2. 数据流

```text
筛选条件 / API 响应
        │
        ▼
边界校验（空值保留 null，不把未知写成 0）
        │
        ├─ KPI 与 <table>
        ├─ 移动平均 → Line
        └─ 去掉某一度量缺失行的子集 → Area
                    │
         同一 syncId + syncMethod="value"
```

业务记录的权威不在图表 props 里。不要让 Query 缓存、Zustand 和 `data` 各算各的。`dataKey="reads"` 只是从行里取 y；`XAxis dataKey="day"` 是类目身份。库不会知道这是累计还是当日，也不会替你去重。

```tsx
<ResponsiveContainer width="100%" height={240}>
  <BarChart data={rows} accessibilityLayer>
    <XAxis dataKey="day" />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Bar dataKey="reads" name="阅读量" fill="#236b53" />
  </BarChart>
</ResponsiveContainer>
```

重绘靠 props。不需要 `setOption`。`ResponsiveContainer` 观察父级尺寸；父级没有确定高度，或 flex 子项没写 `min-width: 0`，图会是 0。隐藏的 Tab 不要继续挂着图表。v3 也有图表自己的 `responsive`。本 Demo 只用 `ResponsiveContainer`，一个项目不要两套尺寸策略叠在一起还不写明谁说了算。

Lab 的双轴是另一件容易看错的事：阅读次数和收藏率不能共用一根轴。次数轴禁止小数；百分比轴域是 0–100。

## 3. Lab 三层在演示什么

**basic**：七天阅读柱，表和柱用同一 `sampleRows`。改 revision 只是换入新数组。

**business**：柱（阅读、收藏）加线（收藏率）。图例打开。绝对量在左，比率在右。

**advanced**：天数输入、可关比率、刷新到 1000 次停止。多次进入离开页面，确认 SVG 随卸载走，而不是留在文档里。`chart-policy` 的单测只证明窗口和上限，不证明 ResizeObserver。

## 4. 生产里更进一步的三层（当前 Demo 未挂载）

### 两张图按日期同步，而不是按下标

当上面的阅读序列和下面「去掉收藏为 null 的日子」长度不同时，默认 `syncMethod="index"` 会把第 i 个点对到另一张图的第 i 个点，日期可能不是同一天。

```tsx
<LineChart data={chartRows} syncId="report" syncMethod="value">
  <XAxis dataKey="day" />
  <Tooltip />
  <Line dataKey="reads" connectNulls={false} />
  <Line dataKey="rollingReads" connectNulls={false} />
</LineChart>

<AreaChart data={nonMissingSaves} syncId="report" syncMethod="value">
  <XAxis dataKey="day" />
  <Tooltip />
  <Area dataKey="saves" />
</AreaChart>
```

`value` 按类目值对齐 tooltip。这不等于 `Brush` 的区间过滤也正确。Brush 仍可能按索引共享视窗。不同长度、有缺口时，拖完 Brush 要在浏览器里对两张图的起止日期，对不上就在业务层自己过滤，不要写「已经同步」。

移动平均遇到缺失返回 null。`connectNulls={false}` 把缺口留在线上。比率只使用阅读和收藏都存在的日子，否则分母被不完整的天拉低。

### 实时追加并且不泄漏

```tsx
useEffect(() => {
  if (!playing) return
  const id = window.setInterval(() => {
    setRows((prev) => appendRealtime(prev, makeNext(prev), 24))
  }, 1500)
  return () => window.clearInterval(id)
}, [playing])
```

不可变追加，稳定的日期身份，上限防止 SVG 无限变长。`24` 和 `1500` 是教学数字，不是性能阈值。StrictMode 会执行清理再执行一次，interval 不能累积。`prefers-reduced-motion` 时关掉 `isAnimationActive`。Lab 的 A02 示例没有这条流；A01 的流是 ECharts 的，不要混用。

### 请求竞态

频道从 A 切到 B 时，A 的慢响应不能 `setRows`。

```tsx
useEffect(() => {
  const controller = new AbortController()
  loadSegment(segment, controller.signal)
    .then((rows) => {
      if (!controller.signal.aborted) setRows(rows)
    })
    .catch((error) => {
      if (!controller.signal.aborted) setError(String(error))
    })
  return () => controller.abort()
}, [segment])
```

取消不是失败。重试不要在 effect 里无条件循环。Lab 示例的数据是本地函数，没有这条路径。

## 5. 反例

### 反例 1：高度是 auto，子级 100%

```tsx
<div style={{ height: 'auto' }}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={rows}><Line dataKey="reads" /></LineChart>
  </ResponsiveContainer>
</div>
```

父级没有非零高度。正确写法是明确像素高度，网格子项 `minWidth: 0`。用浏览器量 SVG 的 bounding box，折叠侧栏后再量一次。

### 反例 2：长度不同还按 index 同步

```tsx
<LineChart data={reads} syncId="report">{/* 默认 index */}</LineChart>
<AreaChart data={saves.filter((row) => row.saves != null)} syncId="report" />
```

改成两边都 `syncMethod="value"`，并用同一个 `day` 身份。悬停缺口两侧，tooltip 上的日期必须相同。Brush 另测。

### 反例 3：缺失写成 0

```tsx
const values = apiRows.map((row) => ({ ...row, reads: row.reads ?? 0 }))
```

未知不是低谷。把 `null` 传进去，`connectNulls={false}`，表格写「缺失」。Lab 的 `sampleRows` 没有缺失，所以它展示不了这个区别。

### 反例 4：无取消的切换

```tsx
useEffect(() => {
  void fetch(`/api/stats?segment=${segment}`).then((r) => r.json()).then(setRows)
}, [segment])
```

慢的 A 会盖住 B。用 AbortController，或 Query 的 queryKey 把频道算进去。

### 反例 5：每次更新换 key

```tsx
<LineChart key={Date.now()} data={rows} />
```

tooltip、Brush 和焦点都会被拆掉。保持组件位置，用 `data` 驱动更新。

### 反例 6：只靠颜色

图外要有标题、表和缺失说明。Recharts 3 的 `accessibilityLayer` 改善键盘，但不是 WCAG 合格证明。`prefers-reduced-motion` 时关动画。不要把不可信 HTML 塞进自定义 tooltip。

### 反例 7：render 里 Math.random

每次渲染柱高都变。用稳定输入。Lab 用 `revision` 和纯函数就是为了这个。

### 反例 8：百万事件直接进 SVG

先聚合。节点数、标签和 tooltip 要在目标数据上量，不要从 14 天演示推断。

## 6. 组合

**Query + Zod**：HTTP 进缓存，schema 在边界解析，领域函数出 KPI，Recharts 和表格吃同一份派生数据。缓存键包含频道、时间范围、语言和租户。tooltip 里格式化过的字符串不是权威数字。

**TanStack Table**：排序和导出用同一批记录。不允许表导出 100 行、图上却是另一批还不说明。

**react-grid-layout**：只有仪表盘真的要拖。拖动中可关动画，松手再重算。不需要 init/dispose。

## 7. 生产清单

| 场景 | 风险 | 处理 |
| --- | --- | --- |
| 加载 / 空 / 错误 | 旧图被当成新条件的结果 | 三态写明；空不是 0 |
| null 与 0 | 比率被缺失拉低 | 契约分开；线断开；表上注释 |
| 类目很多 | SVG 和轴标签变慢 | 先聚合；用真实数据做 Profiler |
| 容器动态 | 0px 或藏在 Tab 里 | 明确高度、`min-width: 0` |
| 竞态 | 旧筛选覆盖新图 | AbortController 或 queryKey |
| 减少动态 | 动画不停 | `isAnimationActive` 跟媒体查询 |
| 读屏 | 点读不出来 | 语义表格和摘要 |
| 导出 | 截图丢掉 tooltip | 从源数据导出 |
| SSR | 首屏量不到尺寸 | 客户端边界和占位 |
| 时区 | UTC 日期被本地偏移 | 身份用稳定的日历日，显示层再本地化 |
| IME | 图表不处理输入法 | 筛选框自己测组合输入 |

性能假设（100 / 1,000 / 10,000 点、关动画、聚合）在本仓库没有浏览器测量，不要写成已经得到的数字。

## 8. v2 到 v3

3.0 换过内部状态，拿掉了 `recharts-scale`、`react-smooth` 等依赖。不要把 v2 文章里的私有状态 API 搬过来。升级时核对 `react-is` 主版本，回归 tooltip、Brush、动画、焦点和 SSR。`Cell` 的去留以 3.10.1 的类型和文档为准，不要用一条未合并的讨论代替。

官方迁移说明：https://github.com/recharts/recharts/wiki/3.0-migration-guide

## 9. 练习

1. 在现有数据上增加「只看阅读 / 只看收藏」，不要做第二份缓存。图表和表一起变；若引入缺失日，不能画成 0。
2. 用 Query 换掉本地 `sampleRows`。A 切到 B 时不出现过期行；500 和超时可恢复；取消不当成失败。不要用生产密钥。
3. 两张图保持 `syncMethod="value"`，造不同的缺失日，拖 Brush，记下可见起止日期是否一致。不一致就写进限制，不要声称天然正确。

## 10. 证据

`tests/chart-policy.test.mts` 只覆盖窗口、标签和刷新上限。它不 import 图表渲染。sdk / build / browser 在有收据之前是 NOT_RUN。研究包里「领域模块 9 项单测通过、安装超时」是 2026-10-23 那份稿子的环境记录，不是本仓库的验收。

## 11. 官方资料

- https://recharts.github.io/en-US/
- https://github.com/recharts/recharts
- https://www.npmjs.com/package/recharts
- https://recharts.github.io/en-US/api/LineChart/
- https://recharts.github.io/en-US/api/ResponsiveContainer/
- https://recharts.github.io/en-US/api/Tooltip/
- https://recharts.github.io/en-US/api/Brush/
- https://github.com/recharts/recharts/blob/main/storybook/stories/API/Accessibility.mdx
