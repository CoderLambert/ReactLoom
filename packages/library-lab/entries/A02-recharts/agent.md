# A02 Recharts — Agent 工程选型与迁移

适用中小规模 React 声明式 SVG 图表。不适合千万点、高频 Canvas/GPU 绘制、复杂地图。代替方案 A01 ECharts / A04 uPlot，需基于真实场景性能证据决定。

## 读取顺序

library.json → examples/example.tsx → guide.md → verification.json。实际可移植代码是 sampleRows 数据映射及 JSX 图表；examples/demo.tsx 只是出口，不能把 Lab 页面样式当业务能力。

## 版本边界

Recharts 3.10.1、react-is 19.3.0，需与宿主 React 版本对应。本轮属 recreated，SDK/build/browser 均 NOT_RUN，不要写入生产已验收清单。

## 实施模板

在业务 API adapter 处理时区与数据模式，把已验证的数据数组交给 ResponsiveContainer；父节点必须有非零高度。多单位使用多个 YAxis / yAxisId。loading/error/empty 由宿主拥有，图表不自行发请求。必须提供真实数据表作为等价替代。

## 禁忌

- 直接把远端对象结构映射成任意 HTML Tooltip；
- 用随机 render 数据制造不稳定图；
- 把未知数据默认为业务事实零；
- 两个图形库同时管理同一 SVG 节点；
- 没有尺寸保障就依赖百分比高度。

## 最小测试

真实 SDK import、TS typecheck、Vite build、非零宽高/resize、dataKey/axis、3–14 范围、卸载重挂载、表格辅助技术。官方：https://github.com/recharts/recharts
