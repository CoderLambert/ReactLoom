# A02 Recharts：声明式业务图表完整实战

## 使用与选型

Recharts 以 React 组件声明图表结构，适合中等规模的业务报表、统计卡片和需要与 React 状态同步的可视化。它主要生成 SVG，而不是 GPU 引擎。绘制规模巨大、复杂地图或大量实时点时优先对比 A01 ECharts、A04 uPlot。不要凭名称声称它比 Canvas 方案更轻。

## 安装与导入

    pnpm add recharts@3.10.1 react-is@19.3.0

官方 README 明确要求 react-is 与宿主 React 版本匹配。ReactLoom 当前为 React 19.3.0，迁移到 React 18 时须调整版本。真实实现位于 examples/example.tsx；examples/demo.tsx 仅作为 Lab adapter 重新导出。

    import {ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip} from 'recharts';

## 三层演示

**basic**：使用 ResponsiveContainer 和 BarChart 绘制七天阅读量；数据表具备同等含义。每次改变 revision 都通过 React 重新传入数据。

**business**：ComposedChart 组合柱形和折线，阅读与收藏使用左轴，收藏率使用右侧百分比轴；选取业务数据时不能混淆绝对数值与比例。

**advanced**：输入 3–14 天范围，在进入图表前收敛有限非负数；可以关闭收藏率；多次进入/退出 Tab 检查 SVG 资源与 ResizeObserver 的生命周期。

## 生产最佳实践

- 明确容器尺寸：单纯 height:100% 的子级在无父高度时容易得到 0，必须提供真实高度。隐藏 Tab 时不应继续挂载图表。
- 统一 DTO：在 API adapter 中处理时区、缺失值和非法数字。真正的缺失数据不能自动填为 0；示例 validCount 只用于受控本地 fixture。
- 轴和单位：千次数和百分比使用独立 YAxis，否则误导用户。
- React 所有权：不要操作 Recharts 生成的 SVG DOM 来修补状态，统一依赖 React render/unmount。
- 性能：先聚合再渲染大量事件数据；Tooltip、数据标签和 SVG 节点数越多，越应做真实浏览器测量。
- 可访问性：SVG 图不是完整的数据表达，必须有文字描述、图例以及可读的表格替代。
- 安全：不要直接渲染来源不明的 HTML Tooltip，避免把远端 HTML 当作受信任 React 节点。

## 五组反例与修复

1. 父节点没有非零高度导致空白图：设置明确像素/布局高度。
2. 收藏率与阅读量混用 YAxis 导致比例失真：分不同 yAxisId 和单位。
3. 在 render 中 Math.random 生成数据，使图形每次重绘跳变：通过稳定输入和确定性 fixture 生成。
4. 将百万原始事件直接送入 SVG，造成大量节点：服务器聚合或采用 Canvas。
5. 依赖绿色/红色区分趋势、无表格/文本：补充文字统计与可访问数据视图。

## 组合应用

Recharts + TanStack Query：由 Query 拥有请求/重试/缓存，图表只消费已校验结果，不自造第二套远程数据状态。Recharts + Zod：转换边界校验 DTO，绘图层只处理可用业务数据。

## 迁移练习与验收

练习：把新闻列表转成每日阅读/收藏数据，定义时区和“无数据”语义；模拟 API 的过期响应，确认不会让新筛选器展示旧报表。

本轮仅提供真实库代码，SDK、完整 typecheck/build、浏览器仍 NOT_RUN，不能声称运行通过。测试应覆盖非零容器、横向缩放、输入上下限、Tooltip、切换 Tab 卸载和数据表键盘读取。

## 一手资料

- https://github.com/recharts/recharts
- https://recharts.github.io/en-US/api/
- https://www.npmjs.com/package/recharts

许可证 MIT。本示例仅使用原创本地数据。
