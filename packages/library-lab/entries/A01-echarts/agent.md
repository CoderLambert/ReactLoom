# A01 ECharts — 给工程 Agent 的集成指南

## 应用何时采用

报表含混合图形、多数据系列、缩放、复杂交互时适合；若只要一个简单声明式 React 图表，比较 A02 Recharts。ECharts 6.1.0，Apache-2.0，需实际核验目标项目兼容性与 lockfile。

## 移植最小单元

读取 `examples/example.tsx` 的 ECharts 注册、init/setOption/ResizeObserver/cleanup，不必复制 Lab 的按钮与示例固定数据。入口 `examples/demo.tsx` 只为宿主注册。别把 `charts` 模块塞进共享 SPA 首页入口，使用动态 import 隔离。

## 必须保留的正确性约束

- `use()` 注册与 renderer 只一次；初始化必须拿到真实 DOM。
- 在 effect cleanup 中 `observer.disconnect()`、`off('click')`、`dispose()`。
- 监听容器宽度，不仅是 window resize；React StrictMode 下重复 mount/unmount 不泄露实例。
- 数据刷新调用 `setOption`，不要每条数据重新 `init()`。
- Canvas 不替代文本可访问数据；图例与数据表提供说明。
- 不把服务端不可信字段拼入 HTML formatter。

## 必须验证

真实 ECharts SDK import、构建 bundle、浏览器实际图形、更新与缩放、卸载重挂后清理、Tooltip 交互、文本表格对应。可 mock 业务数据，但绝不能 mock ECharts 后写 SDK PASS。参考 library.json、verification.json 判断当前证据；当前 SDK/build/browser 都不是 PASS。

## 相关

A02 Recharts：简单 React 业务图；A03 Chart.js：简单 Canvas 图；A05 D3：底层数据映射。官方 https://echarts.apache.org/handbook/en/basics/import/ 。

## 背景标签页与动画策略

迁移 `examples/stream-policy.ts`，将“用户请求播放”与 `shouldAdvanceReadingStream` 的实际播放分开。监听 document.visibilitychange 和 matchMedia('prefers-reduced-motion: reduce')，在 cleanup 对称注销。稳定 interval 不随 tick 频率重复安装，刷新由 `advanceReadingCounts` 执行。双系列图必须提供两系列完整文字数据，不能只呈现颜色差异。纯逻辑断言不是 ECharts 真实SDK/浏览器验证。

## wave18资源不变式

A01图表实例由挂载Effect唯一拥有；ResizeObserver只触发合并的rAF，不直接向已dispose实例调用resize。卸载先disconnect再cancelAnimationFrame并dispose。容器必须允许窄于250px、尺寸为0时不传给resize；缩放与reduced-motion须浏览器实测。点选反馈包括实际seriesName、name及简单value；不要将未知值塞进HTML formatter。源码/纯规则核查不构成官方ECharts运行PASS。

## wave23 离屏暂停与键盘等价选点

高级连续更新必须把 `document.visibilityState`、目标容器 `IntersectionObserver`、减少动态偏好、120次刷新上限合并控制；达到上限后不创建新定时器。复位必须重置 ref 和 state。为Canvas图表提供可聚焦的等价表格按钮，并通过真实 ECharts `dispatchAction` 对应 series/dataIndex，而非伪造显示或直接操作内部 ZRender。保留监听清理；在真实浏览器验证快捷键、焦点、动态数据和卸载，不将纯策略测试当SDK PASS。
