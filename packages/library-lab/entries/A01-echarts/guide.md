# Apache ECharts 6.1.0｜React 实战、生命周期、动态数据与工程选型

Lab 锁定 `echarts@6.1.0`（Apache-2.0）。这是命令式图表实例，不是 React 组件库。地图瓦片、第三方地理数据和字体要单独核对许可。

没有 `docs/library-lab/evidence/runs/` 里对得上当前指纹的收据时，`verification.json` 的 sdk / build / browser 保持 NOT_RUN。仓库级 Actions [41779873259](https://github.com/CoderLambert/ReactLoom/actions/runs/41779873259) 通过了安装、typecheck、生产构建、52 个 SDK 文件（153 项）和 45 项 Playwright，那不是本条目的逐库 PASS。

## Lab 当前示例

可迁移实现是 [`examples/example.tsx`](examples/example.tsx)，[`examples/demo.tsx`](examples/demo.tsx) 只重导出。播放门禁在 [`examples/stream-policy.ts`](examples/stream-policy.ts)。

示例实际做了这些事：

- 模块顶层一次 `use()`，只注册 `BarChart`、`LineChart`、`GridComponent`、`TooltipComponent`、`LegendComponent`、`TitleComponent` 和 `CanvasRenderer`。
- `init` 放在 effect 里，拿到真实 DOM。清理时 `ResizeObserver.disconnect()`、取消尚未执行的 `requestAnimationFrame`、`chart.off('click', onClick)`、`dispose()`。
- 数据更新走 `setOption(..., {notMerge: true, lazyUpdate: true})`，不在每次 tick 上重新 `init`。
- basic 是七日柱状图；business 是「本周」柱 + 「上周」折线，表格有两行。
- advanced 用 1200ms interval 轮流给某一天 +3。`shouldAdvanceReadingStream` 要求 level 是 advanced、用户点过开始、页面可见且容器在视口内、未到 120 次上限，并且在减少动态时没有被显式允许。隐藏标签页或滚出视口会停表，回到可见且意图还在时恢复。
- 表格按钮调用真实 `dispatchAction({type:'showTip', seriesIndex, dataIndex})`，和 Canvas 点击共用选择文案。

当前示例**没有**挂载 `dataset` / `encode`、`replaceMerge`、服务端 SVG（`ssr: true`）或 Query 请求。下面仍把这些写成生产教学，迁移时要自己接到业务数据上，不要以为 Demo 已经做完。

## 0. 先看结论：什么任务用、什么任务不用

| 真实需求 | ECharts 的价值 | 先比较别的 |
| --- | --- | --- |
| 后台报表：折线、柱、图例、轴上 tooltip | option 把多系列放进同一坐标系 | 只有一条 sparkline 时，原生 SVG 可能更小 |
| 运营看板：缩放、图例开关、点选 | 同一实例上 `setOption` 更新 | 非标准几何下探 D3（A05） |
| 阅读量 / 收藏量随时间变化 | 业务 state 映射成 series，表格给同等数字 | 数十万点的时序先用 uPlot（A04）做基准，不要从 7 个点推断 |
| 要和 React 组件、双轴百分比混排 | 可以，但声明式 SVG 更自然的是 Recharts（A02） | 标准统计图也可比 Chart.js（A03） |
| 服务端要一张静态图 | 官方有固定宽高的 SVG `ssr: true` | tooltip、点击、resize 仍是客户端的事 |

默认先核对图表种类、包体积和真实数据量。没有具体阻碍时，不要为了已有的柱线再自研一套 Canvas 引擎。

## 1. 核心模型与工作机制

- `echarts.use([...])` 必须在 `init` 之前，并且只注册用到的图表、组件和一个 renderer。
- `init(dom, theme, opts)` 只能对着已经提交、宽高非 0 的 DOM。不能在 render 函数里创建。
- `setOption` 更新的是当前 option，不是新的图表实例。ECharts 默认按组件 id 合并；删系列时合并会留下旧系列。本示例每次整份替换，所以用了 `notMerge: true`。若只想替换 series、保留其它组件状态，生产代码应显式 `replaceMerge: ['series']`，并在浏览器里看图例和动画是否符合预期。不要每次数据变化都 `dispose` 再 `init`。
- `resize()` 看的是容器，不是 window。侧栏拖动不会触发 `window.resize`。
- `on` / `off` 必须成对，并且 handler 引用稳定。effect 依赖变化时先卸旧的再挂新的。
- `dispose()` 在卸载、换 DOM 节点、StrictMode 的「挂上—卸下—再挂上」里都要走到。实例放 ref，业务数字放 React state。图表不是第二份业务缓存。
- `CanvasRenderer` 与 `SVGRenderer` 二选一打进包。本示例是 Canvas，所以图表本身不是读屏能逐点理解的视图，必须有表格。

## 2. 三个层次怎么读

### Demo 1：柱状图

`level === 'basic'` 时 series 只有「阅读量」柱，`xAxis.data` 是周一到周日。点选显示系列名、日期和值。数字以表格按钮为准，Canvas 只是同一数组的另一种画法。

动手：把 `type: 'bar'` 改成 `line` 之前，确认 `LineChart` 已经在顶层 `use()` 里。没注册的类型不会出现，也不会给出友好的 React 错误边界。

### Demo 2：本周柱 + 上周线

business 用两个 series 共享类目轴。图例打开。表格增加「上周」行，避免对照数据只存在于颜色里。

这还不是 `dataset.dimensions` + `encode`。生产报表更适合把接口记录放进 `dataset.source`，用 `encode` 声明 x/y，而不是在十个分支里手拆数组。缓存归 TanStack Query，图表只消费已经校验的行。

删掉「上周」时不要只 `setOption({series:[本周]})` 还指望默认合并。本示例靠 `notMerge: true` 整份换上；若你改成合并更新，必须补 `replaceMerge` 并用浏览器确认旧折线消失。

### Demo 3：增量、离屏和销毁

advanced 的定时器由 `playbackActive` 决定，不由单独的 `setInterval` 依赖去抖。

- 用户意图（`live`）和实际是否走表是两件事。隐藏、离屏、减少动态都会停，但不清掉「用户想播」；回到可见且仍未到上限时恢复。
- `allowMotion` 只能覆盖减少动态，不能覆盖隐藏标签页。
- 上限 `MAX_READING_UPDATES = 120`。到顶后不再挂 interval，必须按复位把 tick ref、计数 ref 和 state 一起清零。只清 state 会让下一次从旧 tick 继续。
- `ResizeObserver` 把爆发的尺寸变化收成一帧。宽度或高度为 0 时不调用 `resize()`。清理时取消那一帧，避免 dispose 之后旧帧打到已销毁实例。
- 容器没有 250px 的最小宽度。窄布局应缩小，而不是把页面撑出横向滚动。

原始研究稿里的「每 1500ms 保留最近 12 点」不是本文件的行为。Lab 是原位 +3，窗口长度固定为 7。若业务要滑动窗口，在纯函数里实现并单测，不要改 effect 里直接 `push`。

## 3. 反例

### 反例 A：render 里 init

```tsx
function Chart() {
  const chart = init(document.getElementById('main')!)
  chart.setOption(option)
  return <div id="main" />
}
```

DOM 可能还没提交，而且每次 render 都新建实例。正确做法是 ref + effect，清理里 `dispose()`。

### 反例 B：只听 window.resize

```ts
window.addEventListener('resize', () => chart.resize())
```

侧栏和网格变宽都不会走这里，监听器也容易漏卸。监听图表 DOM 的 `ResizeObserver`，宽度和高度都大于 0 再 `resize()`。

### 反例 C：on 了不 off

```ts
useEffect(() => {
  chart.on('click', onClick)
}, [onClick])
```

回调身份一变就叠一层。保存同一个函数引用，清理时 `chart.off('click', handler)`。

### 反例 D：删系列仍走默认合并

```ts
chart.setOption({ series: [{ id: 'reads', type: 'bar', data }] })
```

旧的 `saves` 系列可能还在。移除系列用 `replaceMerge: ['series']`。只有确认要扔掉缩放、图例选中等运行时状态时才用 `notMerge: true`。本示例选择了整份替换，因为它的 option 每次都是完整的。

### 反例 E：把 NaN 送进 series

```ts
const value = Number(userInput) // NaN 会进 data
```

在进图表之前区分 0 和缺失。缺失不要画成 0。Infinity 同样先挡掉。总计和表格使用同一套校验后的数。

### 反例 F：Canvas 是唯一呈现

给容器一个短的 `aria-label`，并放等价 `<table>`。`role="img"` 不会把每个点读出来。颜色不能单独区分「本周 / 上周」。正式产品还要查对比度、键盘和趋势的文字摘要。

### 反例 G：tooltip 里拼不可信 HTML

内置 tooltip 的 `trigger: 'axis'` 加 `confine: true` 足够演示。若改成 HTML formatter，不可信字段必须转义，URL 单独允许列表。不要把接口字符串拼进 HTML。

## 4. 更新、性能和故障

1. 先定更新频率。经营报表一天几次，和每秒数百点不是同一条 `setOption` 策略。
2. 按需注册后再做包体积分析。不要引用没跑过的打包数字。
3. 大数据先采样或聚合，再考虑关动画。7 个点的演示不能证明十万点能撑住。
4. 系列用稳定 `id`。条件分支删系列时看合并策略，而不是看 React 是否重渲染。
5. 高度为 0 是「图是空白」的常见原因。本示例容器 `height: 300`。
6. 请求失败归数据层。不要把上一份 option 悄悄当成最新成功结果，除非 UI 写明「显示的是上次成功的数据」。
7. 服务端渲染不能在服务端碰 `window`。官方 SVG SSR 要固定宽高；交互仍在客户端补。

## 5. 和其它库怎么接

**TanStack Query**：Query 拥有请求、取消、staleTime 和缓存键。映射函数把结果变成 option 或 dataset。不要把 Query 数据再写进 Zustand，也不要写进图表实例。

**react-grid-layout**：卡片尺寸变化靠每张图自己的 `ResizeObserver`。拖动过程中不要 `init`。松手后再做昂贵的聚合。

**ExcelJS / 导出**：导出同一份校验后的行。不要从 Canvas 像素反推表。公式注入和数字格式另查。

## 6. 替代方案

| 方案 | 更合适的时候 | 不要直接换掉 ECharts 的原因 |
| --- | --- | --- |
| Recharts（A02） | 图表就是 React 组件，要和表单、双轴百分比混在一棵树上 | 复杂联动和 Canvas 大屏需要另测 |
| Chart.js（A03） | 常见统计图，Canvas 插件模型 | 多坐标系配置密度不同 |
| uPlot（A04） | 密集时序 | 非时序的图例、地图、富交互要更多自研 |
| D3（A05） | 比例尺和自定义几何 | tooltip、轴、图例都要自己负责 |

## 7. 练习

1. 增加 `shares` 系列。隐藏后再显示，图上不能留残影；表格和合计一起变。用浏览器看，不要只看类型检查。
2. 把本地数组换成可取消的请求。快速切换日期时，旧响应不能覆盖新筛选。失败要有错误文案，不能把旧图说成新数据。
3. 连续卸载挂载 20 次。DevTools 里 Canvas 节点和 click 监听不应按次数累积。把观察记下来；静态代码读过不算这项通过。

## 8. 证据

本目录可以跑的纯规则是 `stream-policy`，它不 import echarts。SDK 套件在 `tests/sdk.test.mjs`，只有真实执行并留下收据之后，sdk 才能是 PASS。Playwright 里有 `@A01`，同样不能把整次 Actions 绿标抄进 `verification.json`。

## 9. 官方来源

1. 包与 Apache-2.0：https://www.npmjs.com/package/echarts
2. 按需引入：https://echarts.apache.org/handbook/en/basics/import/
3. 尺寸、resize、dispose：https://echarts.apache.org/handbook/en/concepts/chart-size/
4. API 与 setOption：https://echarts.apache.org/en/api.html
5. dataset 与 encode：https://echarts.apache.org/handbook/en/concepts/dataset/
6. 动态数据：https://echarts.apache.org/handbook/en/how-to/data/dynamic-data/
7. 服务端 SVG：https://echarts.apache.org/handbook/en/how-to/cross-platform/server/
8. v6 升级：https://echarts.apache.org/handbook/en/basics/release-note/v6-upgrade-guide/

官方页面证明的是 API 和许可，不证明本 Demo 已在浏览器里验收。
