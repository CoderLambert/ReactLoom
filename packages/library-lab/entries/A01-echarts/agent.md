# A01 ECharts — 工程手册

## 适用

多系列、图例、轴上 tooltip、需要命令式更新的报表。简单声明式 SVG 先看 A02。密集时序先用真实数据对比 A04，不要从七日柱状图推断。

## 版本

`echarts@6.1.0`，Apache-2.0。从 `echarts/core` 按需 `use()`，不要把整包 `echarts` 打进首页。地图和第三方瓦片另核许可。

## 迁移

带走 `examples/example.tsx` 的注册、init、setOption、ResizeObserver 和 cleanup。`examples/demo.tsx` 只给 Lab 用。播放门禁带走 `examples/stream-policy.ts` 的 `shouldAdvanceReadingStream` 与 `advanceReadingCounts`。业务数据换成你的数组，不要复制七日样例。动态 import 这个模块，不要在 SPA 入口静态引入。

## 不可删的清理

effect 的 cleanup 必须 `observer.disconnect()`、取消未执行的 rAF、`chart.off('click', handler)`、`dispose()`，并把 ref 置空。隐藏页面和离屏用同一套「意图」与「是否真的在走表」分离，不要在不可见时继续 setState。复位要同时清 tick ref 和计数 ref。`setOption` 若依赖整份替换，保留 `notMerge: true`；改成合并更新时补上 `replaceMerge`，不要两头都不管。

## 反例

- render 期间 `init`。
- 只监听 `window.resize`。
- `on('click')` 不 `off`。
- 删除系列仍用默认合并，旧 series 残留。
- 把 `NaN` 或缺失值写成 0。
- 用 HTML tooltip 拼接不可信字段。
- 没有等价表格，只靠颜色区分系列。
- mock 掉 `echarts` 再写 SDK PASS。

## 测试断言

- 顶层 `use()` 含当前 series 用到的图表和唯一 renderer。
- 卸载后 `dispose` 被调用，重复挂载不共享上一个 DOM 的实例。
- 容器宽或高为 0 时不 `resize()`。
- advanced：隐藏、离屏、减少动态时 interval 停；未到 120 次且用户意图仍在时恢复；到顶后不再创建定时器。
- 表格按钮与 `dispatchAction({type:'showTip'})` 指向同一 seriesIndex / dataIndex。
- 纯规则命令不能代替浏览器里的像素、tooltip 和读屏。

## 真实限制

本示例没有 dataset/encode，也没有服务端 SVG。`dispose` 释放的是这个 React 实例持有的图表，不要假设它替你关掉页面上别的 ECharts。Canvas 不是无障碍的完整表达。

## 证据

读 `verification.json`。没有 `docs/library-lab/evidence/runs/` 的当前收据，sdk、build、browser 都不是 PASS。Actions 41779873259 的仓库结果不能抄到本条目。
