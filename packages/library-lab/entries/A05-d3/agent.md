# A05 D3 — 工程手册

## 适用

`d3@7.9.0` 做比例尺、轴和 SVG 联结。标准报表优先 A01/A02/A03，对齐时序优先 A04。Lab 把整张 `svgRef` 交给 D3；生产混合模式则让 React 画 mark，D3 只碰专用 `<g>`。不要两种写者操作同一批节点。

## 版本

钉 `d3@7.9.0`，ISC，ESM。从 `d3` 按名导入 `scaleBand`、`scaleLinear`、`axisBottom`、`axisLeft`、`line`、`curveMonotoneX`、`max`、`select`。不要并行安装一份版本不同的 `d3-scale`。类型若来自 `@types/d3`，版本号可以和主包不同，以 API 为准。

## 迁移

v5 的 `d3.event` 和分散 enter/exit 改成回调参数和 `selection.join`，key 用业务 id。ECharts 迁过来时列出 tooltip、空态、表格和导出的新主人。`nice()` 的端点只用于刻度。告警序列不要用 `curveMonotoneX` 冒充原始尖峰。

## 不可删的清理

绘图 effect 的 cleanup 必须 `interrupt`、去掉 `pointerenter`、`remove` 子节点。`ResizeObserver` 断开。若加上 brush/zoom，用命名空间 `.on('.brush', null)` / `.on('.zoom', null)`，并取消 RAF 和 fetch。不要在 render 里 append。

## 反例

```tsx
// 错：React 与 D3 同时拥有 circle
<svg>{rows.map((row) => <circle key={row.day} />)}</svg>
// 对：要么 JSX 独占 mark，要么像 Lab 一样 effect 独占 svgRef
```

下标做 join key、brush 像素当时间、卸载不 remove、8 万 SVG 圆、把缺失画成 0，都不要做。

## 测试断言

策略测试断言尾部窗口、阈值过滤、选中项必须仍可见、宽度夹在 1..4096 且拒绝 0。SDK 收据还要看到真实 `select`/`join`/`axis`/`line`、卸载后 SVG 清空、宽度变化更新 viewBox。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有 brush、zoom、Canvas、HTTP、CSV。表包含被阈值隐藏的行，图不包含。命中只有 `pointerenter`。`curveMonotoneX` 会插值。星期字符串在这份 fixture 里唯一，不能当成通用主键方案。没有帧率数字。

## 断言边界

`tests/chart-policy.test.mts` 覆盖窗口、阈值、选中回落和宽度。SDK 用例要 `import { select, scaleLinear, line } from 'd3'`，对真实 SVG 元素 `join` 后再 `remove`。不要用字符串快照代替比例尺输出。卸载后子节点应为 0。缺收据时保持 NOT_RUN。不要在同一 SVG 上同时用 JSX 和 `selectAll` 删除对方创建的节点。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A05 PASS。不要把策略测试或历史研究 PASS 写入 `verification.json`。

对照 `library.json` 的版本编写 import，不要升到条目未钉死的版本。
`tests/` 中的策略用例不能改写成 sdk 字段的 PASS。
浏览器与构建未留下收据时，对应字段维持 NOT_RUN。
