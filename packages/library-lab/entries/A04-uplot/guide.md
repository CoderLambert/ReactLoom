# uPlot 1.6.32：时间序列 / Canvas 的工程接入

## 为什么用
uPlot 专注快速、低开销的时序曲线，不负责数据抓取、聚合、全套可视分析和现成复杂业务图表。适用 DevOps 监控、RSS 请求耗时、批处理吞吐趋势；不要把它作为流程图、组织架构或复杂交互仪表盘的万能替代。

## 依赖与源码
`pnpm add uplot@1.6.32`；示例入口 `examples/demo.tsx` 导出真正的 `examples/example.tsx`；生产代码必须保留 `import 'uplot/dist/uPlot.min.css'` 和主包。`new uPlot(options, alignedData, host)` 在挂载生命周期中执行，更新用 `instance.setData(next, false)`，响应布局用 `instance.setSize({width,height})`，清理用 `destroy()`。

## 三层实战
1. **basic**：28/60/100 个分钟延迟点；观察 Canvas 与等价 DOM 表格。
2. **business**：双序列按时间对齐，延迟与错误数分别使用不同 y 轴。业务输入只能以同长度的列数组提供，且 x 单调递增。
3. **advanced**：显式启动定时采样，滚动保留至多100条；周期性缺失值用 null 连接空白，而不是写0。暂停、重置和离开页面均关闭计时器。

## 关键模型
`uPlot.AlignedData` 形如 `[timestamps, latency, failures]`；同一数组索引代表同一采样时间。不要传入按对象排列的事件数组期待uPlot替你归一化。时间轴按秒，JavaScript `Date` 需要毫秒，因此显示层要乘1000。对于服务器返回乱序、重复时间戳和多个不同采样频率，需要先按桶聚合、排序与缺值对齐。

## 五个库特有坑
- 在React每次render执行 `new uPlot()` → 多个 Canvas/事件；改为挂载时创建、数据变化时 `setData`。
- `ResizeObserver` 不清理或每次尺寸变化都重复 setSize → ResizeObserver循环与内存泄漏；合并进 rAF，卸载 cancel 并 disconnect。
- 误用 `setData(...,true)` 导致用户缩放回到全域 → 按产品要求确定重置策略，业务层显式控制。
- 把分钟毫秒当成秒 → 时间轴错位；输入API处规范单位。
- 每次更新都创建全量无限历史 → 大输入内存增长；窗口限制与降采样分离处理，并保留真实数据表/CSV给辅助技术。

## 生产最佳实践
数据层先过滤NaN/无穷大、按x排序、根据产品需求处理时区；图层只有DOM/Canvas实例所有权。将 ResizeObserver、DOM事件、流式订阅和定时器全部集中在同一组件卸载清理，不全局清空缓存。对于千万采样，先窗口化或采样再交给uPlot，不能声称当前Demo做过大数据压测。

## 选型
ECharts（A01）图表形态丰富；Chart.js（A03）生态插件更多；uPlot 更适合高密度二维时间序列。是否值得采用取决于实测样本密度、交互需求和设备。

## 验证与来源
目前示例源码存在，但目标SDK/tsc/Vite/Chromium还未执行，状态见 `verification.json`。验证应检查数组列长度、setData后的可视变化、重复mount/unmount后Canvas数回到0、ResizeObserver断开、流式定时器停止、键盘读取表格。

官方： https://github.com/leeoniya/uPlot · https://github.com/leeoniya/uPlot/blob/master/docs/README.md （MIT）。


## 动态采样与横轴可见性（第10轮加固）

uPlot 的 `setData(data, false)` 跳过自动范围重置：当横向时间窗口移动后，新数据点可能位于旧的 X 轴范围之外。这里改用 `setData(data)`，为移动窗口重新计算坐标轴，同时继续复用 Canvas 实例。采样计时器受页面可见性与 `prefers-reduced-motion` 管控；用户可明确覆盖减少动态偏好，但隐藏页面永远暂停。应用恢复前台后仅在用户仍请求采样时继续；暂停不清除历史样本。`examples/stream-policy.ts` 为纯业务判定，测试仅证明策略，真实 Canvas 绘制仍待浏览器核验。
