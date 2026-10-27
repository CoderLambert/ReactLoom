# A01 Apache ECharts — 真实业务图表与生命周期

## 适用范围

用于 Dashboard、报表、时间序列、多种图形组合、交互下钻。它不是 React 组件库，实例由业务组件明确创建和释放。对于非常简单的 React 图表，也可以比较 A02 Recharts 和 A03 Chart.js。

## 安装与按需引入

```bash
pnpm add echarts@6.1.0
```

```tsx
import {init, use} from 'echarts/core';
import {BarChart, LineChart} from 'echarts/charts';
import {GridComponent, TooltipComponent, LegendComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';
use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);
```

**完整可迁移实现**：[examples/example.tsx](examples/example.tsx)。Lab 的适配入口 `examples/demo.tsx` 仅重导出实际实现，源码查看器读取文件字节，而不是另一份手抄版本。

## 三层实验

### 1. 入门：真实条形图

绘制七天的固定阅读次数；类别轴、Tooltip 和完整文本数据表同时存在。不要把 Canvas 当成读屏可理解的唯一表示。

### 2. 业务：柱状与折线叠加

同一坐标系展示本周与上周数据。多系列共享分类轴与 Tooltip。根据报表任务决定是否要分别设置不同纵轴，避免量纲不一致造成误导。

### 3. 进阶：增量更新、动态宽度、资源释放

点“启动增量更新”后按顺序调整样本，确认图表响应；缩小图表容器时由 ResizeObserver 调用 `chart.resize()`。离开当前 Demo 或切 Tab 必须断开 Observer、移除 click 监听、停止 timer，并调用 `dispose()`；StrictMode 下重复挂载同样要干净。

## 数据流和示例所有权

React state（样本）→ `setOption`（更新实例）→ ECharts 渲染到容器。ECharts 实例和 ResizeObserver 仅在组件挂载时创建并由同一个 Effect cleanup 释放；更新数据不能重复 `init()`。复杂图形数据进入适度 memoization，不应把任意 100 万条数据直接作为每秒 React state。

## 专属反例

1. **每次 render 调用 init**：泄漏实例并覆盖 Canvas。应将创建/销毁限定在挂载与清理 Effect 内。
2. **只监听 window.resize**：侧边栏拖动不会触发窗口尺寸变化。应对真正容器使用 ResizeObserver，并在卸载时 disconnect。
3. **将非可信 HTML 注入 tooltip formatter**：不可信字符串可能进入 HTML。这里使用内置 Tooltip 与固定字段；若使用 HTML formatter，必须明确转义与 URL 规则。
4. **仅靠颜色表达两个系列**：需要 legend、文本名称和数据表，考虑色盲与读屏。
5. **用旧 option 与新数据 merge 后残留老系列**：图表结构改变时使用明确的 notMerge/replaceMerge 策略，并测试实际行为；不总是无条件全量重建实例。

## 生产选型

按需注册用到的 Chart/Component/Renderer；主页面只在 Demo Tab 被打开且用户点击运行后动态导入本模块。大数据使用图表采样/渐进绘制等官方机制前先基于真实数据基准衡量。切换主题、renderer 或实例大小要重新审查 resize 和 dispose。对 WebGL 或地图额外核对版权和资源清理。

## 验证矩阵（未通过之前不要宣称完成）

- 构建：检验真实 echarts 6.1.0 类型与 tree-shaking。
- SDK：检查实际 init/getInstanceByDom、setOption、dispose 生命周期。
- 浏览器：图表像素可见、Tooltip、容器缩放、更新暂停、重复挂载不遗留监听。
- 可访问性：表格数值与图形数据一致，状态变化可读。

当前只提交了真实 SDK 调用源码；依赖安装、构建和浏览器验证仍为 `NOT_RUN`，不会借用历史资料的 PASS。

## 参考

- [官方 NPM 按需导入](https://echarts.apache.org/handbook/en/basics/import/)
- [ECharts API](https://echarts.apache.org/en/api.html)
- [Apache-2.0 许可证所在仓库](https://github.com/apache/echarts)

## AB wave9：后台节能、减少动画与等价数据

高级层 `examples/stream-policy.ts` 区分用户点击“开始”的**意图状态**与实际计时器运行状态：页面隐藏、系统偏好减少动态时自动停止增量计时；页面重新可见或偏好解除时在仍有用户意图的前提下恢复。明确勾选允许动态才覆盖减少动态；隐藏标签页永远不继续更新。计数由稳定单一 interval 和 tick ref 推进，避免每1.2秒重复拆建计时器；卸载清理监听及interval。图表 `animationDuration` 也会响应系统偏好。

双系列业务模式的等价表格增加“上周”行，防止仅用Canvas展示对照数据。纯规则测试：`node --experimental-strip-types --test entries/A01-echarts/tests/stream-policy.test.mts`。还需实际 ECharts 初始化、render、ResizeObserver、背景标签和读屏验收，不能视为SDK PASS。

## AB wave18：容器响应式与观察器安全释放

去除图表外层强制250px最小宽度，使狭窄Demo/移动窗口不横向撑破布局。`ResizeObserver`只调度一个`requestAnimationFrame`，容器实际宽高非零才调用真实`chart.resize()`；Effect清理时取消待执行帧、disconnect并dispose实例，避免已销毁ECharts对象在旧帧里被调用。图表点选显示系列名、日期和值而非仅日期；复位同时清空旧选择。减少动态偏好下也取消演示用CSS宽度过渡。需在Chromium真实观察快速拉伸、关闭Tab/StrictMode、双系列点选；尚无SDK/浏览器PASS。

## AB wave23：离屏暂停、演示样本上界与键盘选点

高级模式除 `visibilitychange` 外还用 `IntersectionObserver` 观察真实图表容器；滚动离屏暂停增量计时，返回视口按原用户意图恢复。最多处理 `MAX_READING_UPDATES=120` 次，达到上限不再挂计时器，必须显式复位才能重播；复位同步清理计数 ref，避免重复播放。观察器与 interval 都由 effect 对称释放。

Canvas 点击与表格内可聚焦数值按钮共享选择状态；表格按钮调用真实 `dispatchAction({type:'showTip', seriesIndex, dataIndex})`，可用 Enter/Space 浏览每个系列和分类。当前仅有策略回归源码，**尚未**在真实 ECharts/浏览器/读屏验证焦点、tooltip、销毁或耗能效果。
