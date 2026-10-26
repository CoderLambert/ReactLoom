# D3 实战：React 中控制真实 SVG 图元

## 选型
D3 7.9.0（ISC）适合自定义数据映射、图元联结、坐标轴和复杂图形；若只是常规报表，应优先比较 ECharts/Recharts 的维护成本。官方：https://d3js.org/api 。

## 安装与引入
pnpm add d3@7.9.0
TypeScript 项目如需声明文件，使用与版本匹配的 @types/d3，交由 PLATFORM 在统一锁文件中解析。
实际完整源码：examples/example.tsx（React 适配出口 examples/demo.tsx）。不要复制网页展示层的第二份代码。

## 三层场景
1. **basic**：scaleBand、scaleLinear 和 axisBottom/axisLeft 绘制真实阅读量柱图，理解 domain/range/padding。
2. **business**：line + curveMonotoneX 组合双指标折线；通过数据联结绑定 pointerenter，显示具体日期。
3. **advanced**：3/5/7日切换和阈值过滤，跨零条目检查 D3 轴、line 和事件清理；恢复默认状态。

## React / D3 所有权边界
React 管控外层 DOM 与数据状态；D3 只操作 svgRef 对应的 SVG 子树。useEffect 的依赖包括 width/days/minimum/level；在 effect 开始前清理上一次图元，在 cleanup 时 interrupt + remove；ResizeObserver 另有独立 cleanup。StrictMode 双挂载不能残留上次图元。生产端推荐为静态图形使用 React SVG，确实需要 D3 DOM/zoom/brush 时再交给 D3 管理受限容器。

## 必须避免的反例
- 禁止 select('body') 或全局 selector：会污染其他库/宿主；始终从 ref 作用域开始。
- 禁止把时间窗口数组下标当长期身份：业务行有稳定 ID，轴日期必须来自有效数据域。
- 禁止仅靠颜色或 hover 提供数据：本 Demo 附带真实表格，复杂图表还需焦点工具提示与辅助描述。
- 禁止把 resize 每帧都 setState：观察容器尺寸并抑制同宽更新。大量点或复杂动画需要节流和实际性能测量。
- 禁止漏掉 transition.interrupt、D3事件和 ResizeObserver.disconnect，否则卸载可能遗留定时工作/监听。
- 禁止未设基线就宣称性能优于 Canvas：SVG DOM 规模与设备密切相关。

## 组合与迁移
与 TanStack Query 组合时，让远端缓存归 Query、D3只映射数据；与 React Flow 的节点画布不能共享同一 SVG 所有权。ECharts 提供即用交互但约束定制，Recharts 更偏 React 组件。

## 练习与断言
将指标改为点击切换并为缺失数据提供可见回退。分别测试空数据、多数据点、宽度变化和 StrictMode 双挂载：axis 数量始终稳定、observer 与 DOM 事件卸载。当前源码使用真实 d3 import，但本轮未运行依赖/浏览器，verification.json 为 NOT_RUN，禁止继承历史 PASS。

## 一手资料
- https://d3js.org/api
- https://www.npmjs.com/package/d3
