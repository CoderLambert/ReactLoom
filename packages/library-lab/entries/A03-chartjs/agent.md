# A03 Chart.js — 工程手册

## 适用

`chart.js@4.6.1` 画有界的柱线统计。React 持有 revision 和选中下标，Chart 实例只在 effect 里存在。复杂联动仪表盘看 A01，声明式 SVG 看 A02，高密对齐时序看 A04。不要用包装器再包住已经 `new Chart` 的同一块 canvas。

## 版本

钉死 `chart.js@4.6.1`。研究稿里的 4.5.1 和 `react-chartjs-2@5.3.1` 都不是本条目依赖。类型随主包。只 `register` Bar/Line 用到的 controller、element、category/linear scale、Legend、Tooltip。不要改成 `chart.js/auto`，除非单独量过包体。

## 迁移

从 v2 迁出 `xAxes`、`horizontalBar` 和 bundle 脚本，改成 `scales.x/y`、`indexAxis` 和显式 `register`。若引入 react-chartjs-2，删除手写构造，并把系列身份放到 `datasetIdKey`，id 不随文案翻译。Lab 路径是原生构造：类型变化才 destroy/create，数字变化只 `update('none')`。

## 不可删的清理

创建 Chart 的 effect 必须 `return` 里 `chart.destroy()` 并清空 ref。自动采样的 `setInterval` 在隐藏页签、离开 advanced、revision 到 10000、卸载时清除。`visibilitychange` 监听成对移除。同一 canvas 在旧实例 destroy 完成前不能再 `new Chart`。

## 反例

```tsx
// 错：render 里构造，数据一变就再来一次
if (canvasRef.current) new Chart(canvasRef.current, { type: 'bar', data });
// 对：effect 构造并 destroy；counts 变化时 chart.update('none')
```

未注册就 `type:'line'`、父容器高度为 0、把 canvas 下标当主键、用 0 填缺失、冻结 dataset 再开 decimation，都不要做。

## 测试断言

策略测试只断言 `nextRevision` 停在 10000、`shouldAutoSample` 在非 advanced、隐藏或饱和时为 false、`chartCounts` 与 revision 同步。SDK 收据还要看到真实 `Chart` 构造、`update('none')`、`setActiveElements`、柱线切换不抛 already in use、卸载后 destroy。未拿到 `docs/library-lab/evidence/runs/` 收据就保持 NOT_RUN。

## 真实限制

当前 demo 没有第二条 series、decimation、PNG、CSV、HTTP 取消或 `prefers-reduced-motion`。`animation: false` 是写死的。Chart.js 自己处理响应式，不要再叠无界 ResizeObserver。没有本地 FPS 数字。

## 证据

仓库级 Actions `41779873259`（install、typecheck、build、52 个 SDK 文件 / 153 测试、45 个 Playwright）不是本条目 PASS。不要把策略测试或历史研究 PASS 写入 `verification.json`。
