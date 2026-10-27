# A05 D3 — Agent 工程实施指南

**适用任务**：要求细粒度控制 SVG、scale/axis/shape、品牌化定制交互的图表。常规业务图优先评估 A01/A02，不必默认使用 D3。
**版本与来源**：d3 7.9.0 / ISC；API https://d3js.org/api 。详细限制见 library.json 和 verification.json（当前 SDK/构建/浏览器均未运行）。
**可迁移代码**：examples/example.tsx 中真实绘制算法及 ResizeObserver cleanup；examples/demo.tsx 只是 Lab 适配层。不要从文档粘贴一份可能过期的伪源码。
**React 集成规则**：ref 限定 SVG 的所有权；useEffect 处理数据变化；draw 前清旧图元；return 执行 interrupt、事件解绑及 DOM 移除；ResizeObserver 必须 disconnect。不得修改 document.body 或共享组件的全局 class。
**数据正确性**：空数据时 max 返回空值，应给合理域；比例尺 domain 与图元 key 相符；明确 px/SVG viewBox 与响应宽度的关系。生产业务必须提供数据表或同等无障碍内容。
**常见误用**：useEffect 之外命令式改 DOM；数组 index 当稳定数据ID；依赖尺寸未变化仍重绘；漏清理 transition；把高频 pointermove 更新每个 React 子组件。
**验收**：在真实依赖安装后 pnpm --filter @reactloom/library-lab typecheck、build；浏览器检查三层场景、键盘/屏幕阅读器替代表格、resize 与卸载后 observer 数。缺测试时必须保持 NOT_RUN，不将纯静态校验当 SDK PASS。
**相关库**：A01 ECharts / A02 Recharts 替代；数据来源可由 D07 TanStack Query 驱动，但数据拉取与缓存不交给 D3。

## 第11轮迁移补充

复制 `examples/chart-policy.ts`；确保绘制集合、选中说明、空集状态使用相同 `visibleSeries` 结果。ResizeObserver的隐藏/零宽不应回填虚假的620px，窄屏只省略重复刻度、不丢原始表格数据。实际 D3 SVG 测试待SDK安装和浏览器运行。
