# A04 uPlot 1.6.32：列式时序、窗口所有权与 React 生命周期

uPlot 是 Canvas 2D 的时序图，不是仪表盘全家桶。它吃列对齐的 `AlignedData`，不吃 `{t, y}` 行对象。Library Lab 钉 `uplot@1.6.32`。调用以这个 tag 的 `dist/uPlot.d.ts` 为准，不要从 master 抄尚未发布的 API。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。采样开关在 `examples/stream-policy.ts`。组件 `UplotExample` 持有点数、平移 shift 和是否推流；`TelemetryChart` 持有 uPlot 实例。

已挂载：

- `import uPlot from 'uplot'`，并引入 `uplot/dist/uPlot.min.css`。
- X 是 Unix **秒**：`START + i * 60`。`scales.x.time` 为 `true`，所以库按时间轴解释秒，不是毫秒。
- basic 只有延迟列；business / advanced 增加错误数列，并给它单独的 `errors` scale 和右侧轴。
- 缺失用 `null`：advanced 里 `i % 17 === 0` 的延迟是 `null`，表格显示「缺失」，不是 0。
- 实例只在 `[level]` 变化时重建。数据变化走 `plot.setData(data)`。第二个参数省略，1.6.32 默认重置 scale。注释写明：窗口在往前滑，若不重置，新点会落在视窗外。
- `ResizeObserver` 合并到 `requestAnimationFrame`，宽度变了才 `setSize({width, height: 250})`。cleanup：`disconnect`、`cancelAnimationFrame`、`destroy()`，并在 ref 仍指向该实例时清空。
- 滚动窗口 `WINDOW = 100`。可选采样数 28 / 60 / 100。advanced 每 650ms `shift + 1`。
- `shouldRunStream` 要求 advanced、用户已请求、页签可见，并且没有减少动态，或用户勾了「明确允许」。暂停时保留请求意图，回到前台可恢复。
- 最近五个点的 HTML 表是 Canvas 的文字替代。容器 `role="img"`。

没有挂上、仍要会的生产内容：本机 HTTP `/api/telemetry`、`AbortController` 加请求序号、`setSeries` 隐藏曲线、`setScale` 的 follow / preserve、`batch`、`valToPos` / `posToVal`、框选缩放、`toBlob` PNG、5 万点分桶抽样、ring buffer。下面按 1.6.32 写这些，不要说成当前页面已经做了。

## 何时用、何时不用

适合 APM、资源监控、前端耗时这类**已经对齐**的时间轴：同屏几条线、要平移和放大、希望依赖小。产品价值是把渲染和业务处理分开。官方范围见 [1.6.32 README](https://github.com/leeoniya/uPlot/tree/1.6.32#readme)。

不要用它做地图、桑基、关系图或营销动画。官方没有动画系统。多条序列的 X 几乎完全错开时，不要为了塞进 uPlot 去造巨大的 null 矩阵；列对齐在这种数据上会很贵。[格式说明](https://github.com/leeoniya/uPlot/blob/1.6.32/docs/README.md)。十万可见点、十几条线同时刷新，先在目标设备上测。Canvas 2D 主线程、DPR 和数据变换都可能是瓶颈。上游 README 的单机数字不是这个仓库的基准。

| 候选 | 选它 | 不选它 |
|---|---|---|
| uPlot | 对齐时序、点数上来、形态简单 | X 无法对齐、标注很重 |
| ECharts | 图种多、联动多 | 只有一条高频线时成本可能偏高 |
| Chart.js | 常见 bar/line/pie | 极端时序要和 uPlot 比过再定 |
| Recharts | 中小 SVG 仪表盘 | 高频流式 |
| D3 | 非标准几何 | 标准折线不必从零搭 |

## 版本

| 项目 | Lab |
|---|---|
| 包 | `uplot@1.6.32`，MIT，类型在 `dist/uPlot.d.ts`，不要装 `@types/uplot` |
| 导入 | 默认导出 `uPlot`，CSS 走 `uplot/dist/uPlot.min.css` |
| React | 无 peer。用 effect 适配，不是 `uPlot-react` |
| 渲染 | Canvas 2D，不是 WebGL |

1.6.32 发布于 2025-03-14。master 文档可能描述未发布 API，例如后来的 `setPxRatio()` 或精简 DOM。固定版本上不要调用类型里不存在的方法。商业集成要保留 MIT 声明。数据、瓦片、图标、第三方插件的许可证另算。

## 列式数据

```ts
const rows = [
  { t: 1_789_000_000, latency: 48, errors: 0 },
  { t: 1_789_000_060, latency: null, errors: 1 },
];
const data: uPlot.AlignedData = [
  [1_789_000_000, 1_789_000_060],
  [48, null],
  [0, 1],
];
```

`series[0]` 是 X，后面每一列是一条 Y。各列等长。`null` 是缺测，不能改成 0。TypedArray 表达不了 `null`，缺测就用普通数组，或另设缺失标记。

X 必须唯一且严格递增。重复时间戳先在领域层合并。`Date.now()` 是毫秒；默认时间轴吃秒。差 1000 倍时轴会错位。Lab 用秒并打开 `time: true`。研究稿为了坐标自测把 `time: false`，那是另一条教学路径，不是当前画布。时区、DST、毫秒精度要在进入 uPlot 之前定好，不要指望轴标签替你做业务时区。

当前 `createSeries` 在客户端生成正弦延迟和周期性错误数，并截取最后 100 个点。这是 fixture，不是遥测接口。

## 实例 API（1.6.32）

| API | 含义 |
|---|---|
| `new uPlot(opts, data, element)` | DOM 已经存在才能构造。禁止放在 render |
| `setData(next, resetScales?)` | 整批列替换并重绘。省略第二参时重置 scale。`false` 保留用户窗口，新点可能在窗外 |
| `setSize({width,height})` | 容器变了再调用。Lab 用 rAF 合并 |
| `setSeries(idx, {show:false})` | 隐藏一条 Y，不必销毁 plot。Lab 没做切换，生产应走这里而不是改 `series` 配置重建 |
| `setScale('x', {min,max})` | 显式视窗。跟随最新与保留缩放是两种产品状态 |
| `batch(fn)` | 把 `setData` 和 `setScale` 合成一次提交 |
| `valToPos` / `posToVal` | 相对**绘图区**的 CSS 像素。`canvasPixels: true` 是另一套单位 |
| `posToIdx` / `valToIdx` | 最近的列下标，不一定精确命中，还要处理 null |
| `destroy()` | 卸 DOM 和内部监听。effect cleanup 必调 |

Lab 的流式路径选择重置 scale，因为 X 窗口整体前移。生产里用户一旦框选，就要把策略改成 `setData(data, false)` 并停止自动 `setScale`，否则会抢走缩放。不要在已 `destroy` 的实例上 `setData`。

光标钩子 `hooks.setCursor` 会很高频。React 侧要限频，不能每帧 `setState` 整棵树。Lab 没有接光标，表格只展示末五个点。

## 生命周期

```text
React: samples / shift / level
  -> createSeries() 得到 [x, latency, errors?]
  -> level 变化：destroy 旧 plot，new uPlot
  -> 仅数据变化：setData（重置 scale）
  -> ResizeObserver + rAF：setSize
  -> 卸载：disconnect、cancelAnimationFrame、destroy
```

`opts` 随 level 改变轴和 series 数量，所以依赖写的是 `[level]` 而不是 data。把 `onCursor` 放进 options 对象又放进依赖，会造成无意义重建；要用 ref 保持回调身份。StrictMode 会多跑一次 setup/cleanup，销毁不能省。

PNG：`plot.ctx.canvas.toBlob` 只包含 Canvas 像素，不含 HTML 图例、tooltip 和工具栏。`createObjectURL` 用完要 `revokeObjectURL`，并处理 `toBlob` 回调为 null。相对绘图区的坐标还要加上 `.u-over` 的 `getBoundingClientRect()`，不能把 `clientX` 直接交给 `posToVal`。高 DPR 下不要自己再乘 `devicePixelRatio`，除非明确用 canvas 像素。Lab 没有导出按钮。

## 性能，不要神化

Canvas backing store 随宽度、DPR 和同屏图表数量涨。`Array.splice(0,1)` 在长数组上会搬移；Lab 每次重建最多 100 列的新数组，650ms 一次，便于阅读。生产高频接入要用定长 ring buffer，按 UI 节拍快照再 `setData`。

显示层抽样（每桶留 min/max）会丢形态。统计、告警、账单必须用原始序列，不能用抽样结果。本条目没有本地渲染基准，不写 FPS 或内存字节。

## 反例

把行对象直接交给构造函数：

```ts
// 错：uPlot 要的是列，不是对象行
new uPlot(opts, rows as unknown as uPlot.AlignedData, host);

// 对：先对齐
const data: uPlot.AlignedData = [
  rows.map((row) => row.t),
  rows.map((row) => row.latency),
];
```

| 错误 | 后果 | 正确 |
|---|---|---|
| `Date.now()` 当秒放进默认时间轴 | 轴差 1000 倍 | 除以 1000，或显式 `ms: 1` / `time: false`，全链路同一单位 |
| 缺测写成 0 | 假低点 | `null` 断线，并在表里写「缺失」。Lab advanced 已这样做 |
| render 里 `new uPlot` | 多 canvas、监听泄漏、缩放被重置 | mount 一次；数据走 `setData` |
| 只听 `window.resize` | 侧栏拖动时图不跟 | `ResizeObserver` + rAF + `setSize`，cleanup 断开 |
| 流式 `setData(data, false)` 却希望自动跟随 | 新点在窗外 | 跟随模式用 `setScale`；用户缩放后暂停跟随。Lab 选择默认重置 |
| `posToVal(event.clientX, 'x')` | 把窗口坐标当成绘图区 | 先减去 `.u-over` 的 left |
| 用抽样列做审计 | 极值丢失 | 全量数据做统计，Canvas 只拿显示预算 |
| tooltip 用 `innerHTML` 拼网络字符串 | XSS；跨域图污染 canvas | React 文本或 `textContent` |
| 卸载只清 interval | plot、observer、rAF 仍在 | 三者加上 `destroy` 一起收 |

## 安全与无障碍

生产接口要校验来源、身份、体积、CORS 和速率。`null`、NaN、Infinity、非安全整数时间戳在边界拒绝。HTTP 503 不是空数组，上一张图留着。`AbortController` 不保证服务端计算停止，还要请求序号。Lab 没有这些请求。

Canvas 不能替代 `<table>`。不要用 `aria-live="assertive"` 播报每次 hover。颜色不能是唯一编码，表里要有数字。触控缩放未在本 demo 验收。

## 组合

**uPlot + TanStack Query + Zod。** Query 管缓存和 `signal`，Zod 收 JSON，领域层去重、对齐、补 `null`，uPlot 只收数值列。缓存键带上主机、分辨率和时间范围。不要在 Query cache 和 plot 实例里各存一份可写权威数据。Lab 用本地公式代替这一层。

**uPlot + 可调布局 + ExcelJS。** 布局变化触发 `setSize`。工作簿从完整原始行生成，不从抽样或 PNG 反推。字符串单元格防公式注入。

**uPlot + Worker。** 分桶和异常检测放 Worker，主线程按批 `setData`。`Float64Array` 可以 transfer，转移后主线程不能再读那块 buffer。不要每个 socket 消息都 `setData`。

## 生产清单

1. X 单位全链路一致，唯一且递增。
2. 缺测是 `null`，列等长。
3. 构造在 effect，销毁成对。
4. 数据更新与结构更新分开：`setData` 对 `setSeries` / 重建。
5. 容器尺寸走 ResizeObserver，隐藏宽度不 `setSize`。
6. 跟随视窗和用户缩放是显式状态。
7. 推流可暂停：后台、减少动态、卸载。
8. 统计不读抽样列。
9. 表格或摘要提供同等数字。
10. PNG 与原始导出分开，Blob URL 释放。

## 升级与练习

1. 数据始终存 UTC 秒，界面切换 UTC 与 `Asia/Shanghai`，DST 当天不把秒再乘 1000。
2. 60 秒延迟和 300 秒错误数对齐成等长列，空洞率过高时提示不适合对齐模式。
3. 用 ring buffer 和 250ms 批刷新替换 Lab 的 650ms 全量 `setData`；暂停和卸载后不得再调用实例。
4. 同时导出 CSV 和 PNG，并核对 PNG 不含 DOM 图例。
5. 放进可拖拽面板，确认 `setSize` 不增加 plot 实例数；StrictMode 下无泄漏。

从 master 迁回 1.6.32 时，删掉类型文件里没有的方法，再对一次 `dist/uPlot.d.ts`。

## 故障排查

空白：CSS 是否引入、宿主是否有宽度、data 是否等长。时间错位：秒和毫秒。隐藏曲线却整图重建：应 `setSeries`。新点看不见：`setData` 的第二参是否为 `false` 且没有 `setScale`。卸载后报错：cleanup 是否仍持有实例。导出只有线没有图例：这是 Canvas 范围，不是失败。

## 官方链接

- [release 1.6.32](https://github.com/leeoniya/uPlot/releases/tag/1.6.32)
- [npm](https://www.npmjs.com/package/uplot)
- [数据格式](https://github.com/leeoniya/uPlot/blob/1.6.32/docs/README.md)
- [1.6.32 类型](https://github.com/leeoniya/uPlot/blob/1.6.32/dist/uPlot.d.ts)
- [LICENSE](https://github.com/leeoniya/uPlot/blob/1.6.32/LICENSE)

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`shouldRunStream` 的测试只证明暂停策略，不证明 Canvas、`setData` 或时间轴。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A04 的 PASS，不要写入 `verification.json`。研究稿里的领域测试通过同样不是本仓库的 SDK 验收。
