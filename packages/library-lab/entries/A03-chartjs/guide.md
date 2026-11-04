# A03 Chart.js：Canvas 图表、实例所有权与 React 边界

Chart.js 画的是 HTML Canvas，不是 SVG 节点树。`Chart` 实例拥有 context、controller、scale 和动画监听；React 只拥有业务数字、选中态和可访问表格。包装器 `react-chartjs-2` 不是 Chart.js 本体。Library Lab 钉的是 `chart.js@4.6.1`，当前示例直接 `new Chart`，不安装包装器。

## Lab 当前示例

挂载入口是 `examples/demo.tsx`，它只再导出 `examples/example.tsx`。纯策略在 `examples/chart-stream-policy.ts`。三层共用同一个组件，靠 `level` 切换控件。

已挂载的行为：

- 模块顶层 `Chart.register` 只登记 Bar/Line 的 controller、element、`CategoryScale`、`LinearScale`、`Legend`、`Tooltip`。没有 `import 'chart.js/auto'`。
- `useEffect` 在 canvas 的 2d context 上 `new Chart`，cleanup 里 `chart.destroy()`。柱/线切换改变 `effectiveKind`，先销毁再新建，避免同一 canvas 上叠两个实例。
- 阅读量来自 `chartCounts(revision)`。按钮和 400ms 计时器只改 revision，随后 `chart.data.datasets[0].data = [...counts]` 再 `chart.update('none')`。类型不变时不重建 Chart。
- 构造当下就用当前 revision 填数据，避免类型切换的瞬间画回 revision 0。
- `options.onClick` 用命中元素的 `index` 写入 `selectedDay`。表格按钮写同一个状态；另一个 effect 调 `chart.setActiveElements` 再 `update('none')`。
- advanced 才允许自动采样。`shouldAutoSample` 要求 advanced、勾选、页签可见，且 revision 小于 `MAX_REVISION`（10000）。隐藏页签、离开 advanced、到达上界都会清掉 interval。`visibilitychange` 在卸载时移除。
- 父容器 `height: 310` 且 `position: relative`。`responsive: true`、`maintainAspectRatio: false`、`animation: false`。Canvas 带 `role="img"`，精确数字在 HTML 表里。

当前 demo **没有**挂上、但仍是生产教学的部分：`react-chartjs-2`、`datasetIdKey`、第二条 series、`parsing: false` / `normalized`、Decimation、`toBase64Image`、CSV、可取消 HTTP、503 时保留上次成功数据。下面按 4.6.1 的官方契约写这些，不要把它们当成已经在 Lab 里跑过。

## 何时用、何时不用

适合运营看板里的柱、线、饼和有界的近实时趋势，以及用户需要一张 PNG 预览的场景。Canvas 在点数上来之后通常比“每个点一个 SVG 元素”轻，但这不是无限数据和帧率保证。默认输出是 Canvas，不是可选择的 SVG 文本。

| 需求 | 优先比较 | 理由 |
|---|---|---|
| 少量常规统计图 | Chart.js 或 Recharts | Chart.js 手动持有 Canvas；Recharts 把 SVG 交给 React |
| 多种联动图、地图、统一 option | ECharts | 组件系统更完整，生命周期也是另一套 |
| 百万级对齐时序 | uPlot | 列式 Canvas 时序更贴这个任务，仍要用真实数据测 |
| 非标准视觉编码 | D3 | 比例尺和形状自己负责 |
| 地图 / 流程拓扑 | MapLibre、React Flow | Chart.js 没有这些模型 |

不适合：开发者要直接改大量 SVG 节点、读屏必须逐点拿到 DOM 文本、海量高频时序还没做基准、或把图表当成业务数据库。Chart.js 没有内置数据表，键盘和读屏路径要另做。官方无障碍说明见 [accessibility](https://www.chartjs.org/docs/latest/general/accessibility.html)。

## 版本与安装

| 依赖 | Lab 钉死的版本 | 说明 |
|---|---|---|
| `chart.js` | **4.6.1** | MIT。研究稿核对过的 4.5.1 不是本条目的 pin |
| `react-chartjs-2` | 未安装 | 研究稿写过 5.3.1。生产若引入，peer 需覆盖本仓库 React 19，并且不要和手写 `new Chart` 抢同一块 canvas |
| React | 模板 Web 侧 19.3 | Chart 只能在客户端 effect 里创建。SSR 用 `use client` 加动态导入，服务端不要碰 Canvas |

浏览器需要现代 Canvas。IE11 不在支持范围内。第三方插件、字体、图标的许可证要单独看，不能从主库 MIT 外推。

按需注册（与当前示例一致）：

```ts
import {
  Chart, BarController, BarElement, LineController, LineElement, PointElement,
  CategoryScale, LinearScale, Legend, Tooltip,
} from 'chart.js';

Chart.register(
  BarController, BarElement, LineController, LineElement, PointElement,
  CategoryScale, LinearScale, Legend, Tooltip,
);
```

漏掉 `LineController` 却 `type: 'line'`，控制台是 `"line" is not a registered controller`。`chart.js/auto` 能省事，也会把没用到的控制器打进包。

## 数据模型与生命周期

`Chart` 持有的是可视化副本，不是业务仓库。顺序是：`new Chart(context, config)` → 改 `chart.data` → `chart.update(mode)` → 需要时 `chart.resize()` → 卸载 `chart.destroy()`。`update('none')` 跳过更新动画，适合采样。官方更新说明：[updates](https://www.chartjs.org/docs/latest/developers/updates.html)。

Lab 的数据流：

```text
revision (0..10000)
  -> chartCounts() 七日整数
  -> React counts 与 HTML 表
  -> datasets[0].data 浅拷贝
  -> chart.update('none')
点击 canvas 或表格按钮
  -> selectedDay
  -> setActiveElements + update('none')
```

点的下标只在 `labels` 与 `data` 同序时等于“周几”。排序或筛选必须同时改两边，不能把 index 当全局主键。

若改用 `react-chartjs-2`，包装器内部也会 `new Chart` 并在卸载时 `destroy`。业务组件不要再写第二份构造和销毁。系列身份默认靠 `label`。`label` 为空、重复或被翻译时，更新会串线。应设 `datasetIdKey="id"`，id 用稳定的 `reads` / `saves`，不要用会随语言变化的文案。匹配看的是这个键，不是数组下标。Lab 目前只有一条「阅读量」，还没有这条身份问题，但一加上第二条线就必须处理。

Canvas 尺寸量的是**父容器**。父级要有真实高度。不要写 `<canvas style="height:40vh">` 或手改 DPR。Chart.js 自己听尺寸变化，通常不必再套一个无界 `ResizeObserver`。从 `display:none` 恢复、打印前后，按文档补一次 `resize()`。[responsive](https://www.chartjs.org/docs/latest/configuration/responsive.html)。

Decimation 只在同时满足这些条件时才有意义：折线、`indexAxis: 'x'`、x 为 linear 或 time、`parsing: false`、数据点超过阈值、dataset 对象可变。插件会改写 `data` 并把原数组留在 `_data`，不要把冻结对象直接交进去。`parsing: false` 时期望的是 `{x:number,y:number}` 且 x 唯一升序。乱序字符串、日期字符串或 `NaN` 会让降采样不生效。这些都还没挂到当前 demo。

## 三层 Demo：挂载了什么，生产还要补什么

### 01 最小：柱状图与键盘等价

basic 固定柱形。点第一根柱或 Tab 到表格按钮，状态文案都来自同一个 `selectedDay`。表格能复制、能读屏；Canvas 只是 `role="img"` 加一段名称，不是数据本身。

### 02 业务：复用实例更新

business 仍是单系列柱图。点「模拟新增阅读」增加 revision，实例不重建。`output` 读出七日合计。生产教学里还应有第二条线、隐藏某一系列、可取消请求、503 时保留上一份成功数据、CSV 公式注入防护。Lab 没有 HTTP，不要把按钮点击说成接口验收。

### 03 进阶：类型切换、有界采样、高亮

advanced 用下拉在 bar/line 之间切换，effect 销毁旧图再建新图。勾选自动采样后每 400ms `nextRevision`，页签隐藏或到 10000 即停。达到上界时按钮禁用。选中态在类型切换后仍通过 `setActiveElements` 对齐。

生产侧的流式图还应：批处理而不是每个点一次 React 提交、窗口截断（研究稿用 180 点，Lab 用 revision 上界而不是点数上界）、`pointRadius: 0`、`prefers-reduced-motion` 为真时禁止动画、`chart.toBase64Image()` 导出并处理跨域污染。当前示例把动画直接关掉，没有读 `prefers-reduced-motion`，也没有 PNG。

## 反例：错误写法和对应修法

在 render 里构造，StrictMode 会打两次，canvas 报 already in use：

```tsx
function Bad({ rows }: { rows: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  if (ref.current) new Chart(ref.current, { type: 'bar', data: { datasets: [{ data: rows }] } });
  return <canvas ref={ref} />;
}
```

构造和销毁放在 effect，数据变化只 update：

```tsx
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const chart = new Chart(canvas, { type, data, options: { animation: false, responsive: true, maintainAspectRatio: false } });
  chartRef.current = chart;
  return () => { chartRef.current = null; chart.destroy(); };
}, [type]);

useEffect(() => {
  const chart = chartRef.current;
  if (!chart) return;
  chart.data.datasets[0].data = counts.slice();
  chart.update('none');
}, [counts, type]);
```

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 忘记 `Chart.register` 对应控制器 | `"bar" is not a registered controller` | 按实际 type 注册 controller、element、scale、插件 |
| 多条线没有稳定 id，只靠可翻译的 `label` | 更新后串线 | `datasetIdKey="id"`，id 不参与 i18n |
| 每个采样都 `new Chart`，数组无限增长 | 监听泄漏、主线程变长 | 有界窗口 + `update('none')`；类型变化才 destroy |
| `parsing: false` 却传入字符串或 NaN | 轴错、降采样条件不成立 | 先校验有限数，x 升序，缺失不要静默当 0 |
| 父容器高度为 0 却 `maintainAspectRatio: false` | 空白或发糊 | 父级 `position:relative` 加明确高度 |
| 只有 Canvas，没有表格 | 读屏拿不到数字 | `aria-label` 只是名称；完整值放 `<table>` 和按钮 |
| 数据集被冻结后开 Decimation | 插件改写 `data` 失败 | 浅拷贝可变 dataset，并满足折线/linear/parsing 前提 |
| 跨域图片进了插件再 `toBase64Image` | `SecurityError` | 同源或合法 CORS；导出放 try/catch。本 demo 无外链图片 |
| 手写 Chart 再套一层 react-chartjs-2 包住同一 canvas | 双重 destroy / already in use | 一个 canvas 只允许一个所有者 |

## 组合

**Chart.js + TanStack Query + Zod。** Query 拥有缓存、重试和 `signal`。Zod 在边界把 `unknown` 收成有限数，分清缺失和 0。Chart 只吃映射后的 `ChartData`。不要把 `chart.data` 当服务器缓存，也不要在 `onClick` 里无界 refetch。500 时保留上次成功数据并标明陈旧。Lab 尚未接入 Query。

**Chart.js + 布局库 + ExcelJS。** 布局库管面板矩形，图表父容器的真实高度决定 canvas。Excel 从同一份领域行导出，不从像素反读数值。导出单元格要对 `=`、`+`、`-`、`@` 做前缀处理。`datasetIdKey` 不随语言变。

**Chart.js + MSW + Playwright。** MSW 模拟 503、超时和坏 JSON；Playwright 点表格按钮、切类型、离开路由后确认没有残留 tooltip。这是迁移练习，不是当前示例的运行路径。

## 生产清单

1. 客户端 effect 创建，cleanup `destroy()`，StrictMode 双挂载不抛 already in use。
2. 只注册用到的控制器；不要用 `auto` 把整库打进去，除非测量过包体。
3. 数据更新走 `update`，重建只留给 type 或 scale 结构变化。
4. 父容器有高度；打印和从隐藏变为可见时补 `resize()`。
5. 系列 id 稳定；点下标不作为主键。
6. 采样有上界，后台页签停止计时器。
7. 动画默认关，或听从 `prefers-reduced-motion`。
8. Canvas 旁有表格、状态文案和键盘路径。
9. Tooltip 回调不插入未净化 HTML。
10. PNG 与 CSV 分开：图是预览，表是数据。跨域 canvas 导出要失败得可见。

## 升级与迁移

**练习 A：Chart.js 2 配置迁到 4.6.1。** 旧的 `xAxes` / `yAxes`、`horizontalBar`、`Chart.bundle.js` 要换成 `scales.x` / `scales.y`、`indexAxis: 'y'` 和按需 `register`。点击从旧 props 迁到 `onClick` 或包装器的 `getElementAtEvent`。在 StrictMode 里挂载卸载 10 次，确认没有残留 tooltip。[v3 migration](https://www.chartjs.org/docs/latest/migration/v3-migration.html)。

**练习 B：定时器采样换成可取消增量。** 用 MSW 提供乱序时间、重复 id、空数组、503 和超时。只有最新请求能回写；10000 这个上界是 Lab 的 revision 帽，点数窗口要另定。导出 CSV 与 PNG，并保持表格与 `prefers-reduced-motion`。不要把 `chart-stream-policy` 的纯函数测试当成 Chart 运行时验收。

## 故障排查

无图：先看父容器高度、canvas 是否还在、控制台是否未注册控制器、数据是否含 NaN。切换后还画着旧系列：查是不是只改了数组下标、没有稳定 dataset id。打印缺图：`beforeprint` 里 `resize`。隐藏 Tab 回来变形：显示后再 `resize()`。

性能先减 DOM、批处理、关动画、限制点数，再谈 `normalized` 和 decimation。官方有 OffscreenCanvas + Worker 的可选路径，但函数和 DOM 插件不能直接跨线程。本条目没有本地帧率或内存数字。

## 官方链接

- [集成与 tree-shaking](https://www.chartjs.org/docs/latest/getting-started/integration.html)
- [响应式](https://www.chartjs.org/docs/latest/configuration/responsive.html)
- [更新与动画模式](https://www.chartjs.org/docs/latest/developers/updates.html)
- [性能](https://www.chartjs.org/docs/latest/general/performance.html)
- [无障碍](https://www.chartjs.org/docs/latest/general/accessibility.html)
- [Decimation 前提](https://www.chartjs.org/docs/latest/configuration/decimation.html)
- [npm chart.js](https://www.npmjs.com/package/chart.js)

比较表是适用性判断，不是未经测量的 FPS 排名。

## 证据

本条目的 sdk、build、browser 在 `docs/library-lab/evidence/runs/` 出现对应该条目的收据之前保持 **NOT_RUN**。`examples/chart-stream-policy.ts` 的策略测试只证明 revision 上界和采样开关，不证明 Canvas、`Chart.update`、`destroy`、Resize 或 Chromium。

GitHub Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright 的结果。它不是 A03 的逐条目 PASS，也不能写进 `verification.json`。历史研究稿里的领域测试通过同样不是本仓库的 SDK PASS。
