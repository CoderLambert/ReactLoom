# A05 D3 7.9.0：比例尺、轴和「谁拥有 DOM」

D3 不是图表组件。它提供比例尺、形状、轴、刷选、缩放和数据联结。标准柱线饼要更快交付时，先看 ECharts、Recharts 或 Chart.js。高密时序先验证 uPlot。瓦片地图用 Leaflet 或 MapLibre。D3 geo 只适合自定义投影，不负责底图托管。

Library Lab 钉 `d3@7.9.0`（ISC）。示例从主包按名导入，不另装一份 `d3-scale` 以免两套子模块。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。窗口和阈值在 `examples/chart-policy.ts`：`visibleSeries`、`visibleSelection`、`measuredWidth`。

已挂载的是**隔离 SVG 上的命令式 D3**，不是研究稿里「React 画 `<rect>`、D3 只画轴」那一版：

- fixture 是周一到周日的 `views` / `saves`。没有 HTTP。
- `ResizeObserver` 把宿主宽度收成 1..4096 的整数，写回 React `width`。
- 每次 `width`、`days`、`minimum` 或 `level` 变化，effect 对 `svgRef` 做 `select`，`selectAll('*').interrupt().remove()`，再 `append` 轴、文字和图形。cleanup 同样 `interrupt`、摘掉 `pointerenter`、`remove`。
- basic：`scaleBand` 按星期字符串、`scaleLinear` 的 range 从下往上、`join('rect')`。Y 域至少跨到 10，并 `nice()`。
- business / advanced：两条 `line` 都用 `curveMonotoneX`，阅读数圆点 `pointerenter` 写 `selected`。
- 窄宽度（<380）刻度隔一个显示。空筛选时状态文案说明没有可绘制数据；选中日被滤掉时明确说不在当前结果里。
- HTML 表展示**未按阈值过滤**的日期窗口（`FIXTURE.slice(-days)`），图只画 `visibleSeries`。指针高亮不等于读屏可用。

没有挂上：brush、zoom、Canvas、`line.defined`、稳定业务 id 的 join key（现在用星期字符串，fixture 内唯一）、HTTP 503、Abort、CSV、SVG 序列化导出。研究稿推荐的混合所有权仍然是生产默认：React 拥有 mark，D3 只拥有带 ref 的轴或 brush 组。Lab 为了把比例尺和 join 放在同一文件里，把整张 SVG 交给了 D3。不要在这张 SVG 里再 `.map` 出 React 的 `<rect>`。

## 四层不要混

1. **事实。** `ReadingPoint` 的 views/saves 是有限数。`visibleSeries` 丢掉非有限 views，以及低于阈值的行。不可信字符串不要进 SVG 属性或 HTML。
2. **编码。** `scaleBand` 把分类放进带宽；`scaleLinear` 把数量映射到像素。数据坐标不是屏幕坐标。SVG 的 y 向下增加，所以 range 写成 `[h - margin.bottom, margin.top]`。[linear](https://d3js.org/d3-scale/linear) [shape](https://d3js.org/d3-shape)。
3. **呈现。** Lab：D3 独占 `svgRef`。生产混合模式：JSX 画 path/rect，D3 只 `.call(axis)` 在专用 `<g>`。官方入门提醒 selection 和 React 会抢 DOM。[getting started](https://d3js.org/getting-started)。
4. **交互。** `brushX` 给出的是像素区间，要 `x.invert` 才回到数据。`zoom` 用 `event.transform`；重置必须走**同一个** zoom behavior 的 `transform`，不能只改一个 React ref。Lab 两者都没做。[brush](https://d3js.org/d3-brush) [zoom](https://d3js.org/d3-zoom)。

`nice()` 只改刻度端点，不能把 nice 后的数写回数据库。`max` 在空数组上是 `undefined`，示例用 `?? 1` 再垫到至少 10。

## API 对照

| API | Lab 怎么用 | 生产边界 |
|---|---|---|
| `scaleBand().padding(.26)` | 星期做 domain | domain 用稳定 id，不用数组下标 |
| `scaleLinear().nice()` | 阅读数轴 | 空集要有退化域 |
| `axisBottom` / `axisLeft` | 每次重建前清空 SVG | 该 `<g>` 不能再由 React 映射 tick |
| `line().curve(curveMonotoneX)` | 两条折线 | 平滑会在尖峰两侧过冲；告警图用 `curveLinear` 并写明插值不是事实 |
| `selectAll().data().join` | 柱和圆点 | key 用业务 id。离开时 `interrupt` |
| `brushX` / `zoom` | 未挂载 | 像素与数据域分开；卸载 `.on('.zoom', null)` |
| `pointer` | 未使用；Lab 用 join 的 datum | 局部坐标仍要 `invert` |

`selection.on('.name', null)` 按命名空间摘监听。动画帧和请求也要在 cleanup 里停。比例尺本身不用 dispose。

## 三层

### 01 柱

basic 六到七根绿色柱（fixture 七天，basic 的 `days` 初始为 7，且 advanced 才露出窗口控件）。指针进入柱子，状态行写出阅读和收藏。表始终在。没有键盘点选柱子；键盘路径只有表格可读，不能算完成无障碍。

### 02 双指标折线

business 同时画 views 与 saves。圆点只挂在阅读数的 y 上。收藏没有独立命中目标。研究稿里的「点 503 保留旧数据、刷选、CSV、UTC 日期」都还在生产教学里，不在这个文件。

### 03 窗口和阈值

advanced 可选最近 3/5/7 天，阅读阈值 0..115。`visibleSeries` 先取尾部再按 views 过滤。收藏不参与阈值。恢复按钮把天数、阈值和选中清掉。宽度变化会重算 viewBox。这不是 8 万点 Canvas，也没有 RAF 绘图循环。

高密点不要为每个点做一个 SVG 圆。那是 Canvas 或 WebGL 加抽样的任务。D3 不会自动 GPU 加速。抽样（包络 min/max）不是 LTTB，不能拿来做告警。Lab 最多七个点，没有这条路径。

## 反例

React 和 D3 抢同一批圆：

```tsx
// 错：JSX 已经声明 circle，effect 又 selectAll('circle').remove()
return <svg ref={ref}>{rows.map((row) => <circle key={row.id} />)}</svg>;
useEffect(() => { select(ref.current).selectAll('circle').remove(); }, [rows]);

// 对（Lab）：SVG 里不写 React 图形，effect 独占 svgRef
// 对（混合）：rect 只在 JSX；轴只在 <g ref={axisRef}> 上 .call(axis)
```

| 错误 | 后果 | 正确 |
|---|---|---|
| `data(rows, (_, i) => i)` 或省略 key 后在中间插入 | 圆点和事件错配 | `.data(rows, (row) => row.id)`，id 在边界唯一 |
| render 里 `select().append()` | StrictMode 重复节点 | 只在 effect 里改 DOM，cleanup 对称 |
| 把 brush 像素当 Unix 时间 | 区间毫无关系 | `x.invert` |
| 只改视觉 transform，不调 zoom behavior | 下一次滚轮跳动 | 同一个 behavior 上 `transform(identity)` |
| `curveMonotoneX` 画告警尖峰 | 路径高出原始数据 | 折线或明确标注插值 |
| 8 万个 `<circle>` | DOM 和命中拖垮主线程 | Canvas + 视口裁剪；表仍给摘要 |
| extent 吃到 NaN | 轴和 path 坏掉 | 先滤有限数；折线用 `.defined` |
| 卸载不摘 `.zoom` / RAF | 监听叠加上去 | 命名空间解绑、`cancelAnimationFrame`、abort |
| 只有图没有表 | 读屏没有精确值 | 表 + 状态文案。Lab 已有表 |
| `innerHTML` 拼用户 SVG | 脚本风险 | JSX 或 `textContent` |
| 把 `nice()` 端点写回 API | 污染事实 | 展示尺度和业务值分开 |

## 性能与 SSR

join 避免重复创建节点，但不把成本变成 O(1)。SVG 节点数仍决定布局和事件。`useMemo` 只在计算重、引用稳时有用。

导出 SVG 要 `xmlns`，外部字体和 CSS 不会自动进去。Canvas `toBlob` 可能给 null；跨域图片会 taint。Lab 不加载外链，也没有导出按钮。

比例尺可以在服务器算。`select`、brush、zoom 只能在客户端 effect。不要在服务端 render 里 append。

## 组合

**D3 + TanStack Query + TanStack Table。** Query 键包含项目和时间范围，`queryFn` 把 `signal` 传给 fetch。校验后的数组同时喂给比例尺和表格。刷选是 UI 状态，不要每次移动光标就 `invalidateQueries`。下面是教学片段，Lab 没装 Query：

```tsx
const request = useQuery({
  queryKey: ['read-metrics', projectId],
  queryFn: async ({ signal }) => {
    const response = await fetch(`/api/projects/${projectId}/metrics`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
});
```

**D3 + react-grid-layout。** 卡片宽高进比例尺。听容器而不是只听 `window`。拖拽把手不要和 brush 抢同一块 pointer。Lab 的 ResizeObserver 只服务这一张图。

**D3 + ExcelJS。** 导出原始点，不从 SVG 坐标反推。公式注入在表格适配器处理。

## 生产清单

1. 一张 SVG 只有一个写者。
2. join key 是稳定 id。
3. y range 反向；空数据有域。
4. `nice()` 不回写事实。
5. effect cleanup 摘监听并 `remove`。
6. 宽度有上界，0 宽不更新。
7. 过滤结果和表的范围写清楚（Lab 表含被阈值隐藏的行）。
8. 高密改渲染器，不堆 SVG 点。
9. 缺失用 `defined`，不用 0。
10. 键盘和读屏走 HTML，不依赖 `pointerenter`。

## 升级与练习

**v5 的 enter/exit 迁到 v7 `join`。** 删掉分散的 `.enter().append()` / `.exit().remove()`，key 用 id。事件从全局 `d3.event` 改成回调参数。cleanup 里解绑。

**从 ECharts 迁自定义编码。** 只迁非标准视觉，tooltip、图例、空态、表格和导出走清单，不要只迁一段 path 就当功能等价。

练习：打乱星期顺序后，命中仍对应该行；views 全非有限时图空、表仍在；给折线加 `.defined`，把某一天改成缺失而不是 0。浏览器里数 mount/unmount 后 SVG 子节点是否回到 0。这些还没有 SDK 收据。

## 故障排查

轴文字叠成几层：清空不完整，或 React 也在画 tick。筛选后选中文案还指向旧日：应像 `visibleSelection` 那样在可见集里查找。宽度抖动：`measuredWidth` 拒绝非有限和 0。卡顿：先数 DOM，而不是先上 WebGL。

## 官方链接

- [Getting started](https://d3js.org/getting-started)
- [API](https://d3js.org/api)
- [Linear scales](https://d3js.org/d3-scale/linear)
- [Shapes](https://d3js.org/d3-shape)
- [Join](https://d3js.org/d3-selection/joining)
- [Events](https://d3js.org/d3-selection/events)
- [Axis](https://d3js.org/d3-axis)
- [Brush](https://d3js.org/d3-brush)
- [Zoom](https://d3js.org/d3-zoom)
- [npm d3](https://www.npmjs.com/package/d3)

## 混合所有权的最小骨架

生产里若改回「React 画柱、D3 只画轴」，结构应是这样，而不是在 Lab 的 `svgRef` 上再叠加 JSX 图形：

```tsx
<svg viewBox={`0 0 ${width} 280`}>
  <g ref={xAxis} />
  <g ref={yAxis} />
  {visible.map((row) => (
    <rect key={row.day} x={scaleX(row.day)} y={scaleY(row.views)}
      width={scaleX.bandwidth()} height={scaleY(0) - scaleY(row.views)} />
  ))}
</svg>
```

轴的 effect 只 `select(xAxis.current).call(axisBottom(scaleX))`，cleanup 时 `select(node).selectAll('*').remove()`。柱的 `key` 用业务 id。Lab 当前没有这条 JSX，它每次清空整张 SVG 再 `join`。两套不要同时启用。

刷选若以后加上，`event.selection` 是像素对。写回 React 的应是 `scaleX.invert` 之后的域，并忽略没有 `sourceEvent` 的程序化事件，否则重置按钮会再次触发状态更新。缩放重置调用创建时那个 zoom behavior 的 `transform`，不要另起一个 `zoom()` 去清画面。

空数据时 `max` 得到 `undefined`。Lab 用 `?? 1` 再抬到至少 10，避免 domain 塌成一点。阈值把所有点滤光后，状态文案走「没有可绘制的数据」，表仍列出该日期窗口里未过阈值的行。这个差异要在界面上说清楚，避免读者以为表和图是同一筛选结果。星期字符串只在这份七天 fixture 里唯一；接上按小时采样的数据后，join key 必须换成不会重复的 id。

`curveMonotoneX` 只用于这份阅读趋势的示意。告警阈值图改回 `curveLinear`，并在图旁写明折线插值不是采样事实。

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 出现本条目收据前为 **NOT_RUN**。`chart-policy` 测试只覆盖窗口、阈值和宽度夹取。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A05 的 PASS，不要写入 `verification.json`。研究稿的领域测试通过也不是本仓库的 SDK 验收。
