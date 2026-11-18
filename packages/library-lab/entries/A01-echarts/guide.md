# Apache ECharts：让同一组指标驱动配置、图表和数据表

运营需要看近七天的文章阅读量，还想与上周对照，并在新数据到来时更新看板。ECharts 把数据与图形的关系写在 `option` 中：日期交给类目轴，数量交给数值轴，一组指标交给一个 series。React 保存业务数字，图表实例负责绘制、提示和交互；更新数字时调用 `setOption`，不用重新创建 Canvas。

本例使用 **echarts 6.1.0**，Apache-2.0。适合多系列报表、混合柱线、图例和命令式交互。偏爱 React 组件式 SVG 的简单图表可比较 Recharts；密集时序应以真实数据量对比 uPlot。ECharts 的成本是模块注册、容器尺寸、实例生命周期和配置复杂度；七个点的演示不能证明大型看板的性能。

这里是本地原创 fixture，没有 NewsHub 接口或随机在线数据：本周 `[12, 20, 15, 28, 22, 34, 27]`，上周 `[9, 13, 18, 23, 19, 25, 22]`，顺序均为周一至周日。图、表、合计和展开的配置使用同一数据来源。

## 数据怎样成为图形

| 概念 | 本例输入 | ECharts 的职责 |
| --- | --- | --- |
| `option` | 一份含标题、坐标轴、系列和交互设置的对象 | 描述当前要呈现的图表 |
| `xAxis` | `type: 'category'`，七个日期标签 | 为同一索引的数据点提供横轴位置 |
| `yAxis` | `type: 'value'`、`min: 0` | 把阅读量映射到纵向数值尺度 |
| `series` | 本周柱、可选上周折线，或实时折线；`data[i]` 对应第 i 天 | 同一坐标系内绘制不同图形，提供事件和提示 |
| 图表实例 | `init` 得到，保存在 ref 中 | `setOption` 更新、`resize` 改尺寸、`dispose` 释放 |
| 应用状态 | `values`、显示对照、播放意图和当前选择 | 决定数据和操作；不是 SDK 内置接口或数据缓存 |

主线是：**按钮或本地 tick 改 `values` → `buildReadingOption` 生成当前配置 → effect 调 `setOption` → 同一实例重绘**。表格和合计直接读取同一 `values`，不从 Canvas 像素或 `getOption()` 反推业务记录。

[`reading-option.ts`](examples/reading-option.ts) 是图表与 SDK 检查共用的真实配置函数。展开“查看传入 setOption 的核心配置”，看到的是当前 `option` 的轴和系列原对象序列化，不是另一份手写示意结果。

## 实验一：从七日数据到柱状图

工程问题：输入的一行数字怎样对应到柱形，更新时会不会重新创建图表？

1. 进入“从七日数据到柱状图”，初始周一为 12，七日合计 158。
2. 点击“周一阅读量 +5”。周一变为 17，合计变为 163，柱高、数据表和展开配置的 `series[0].data[0]` 一同变化。
3. 点击数据表中的 17：调用真实 `dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: 0 })`，图中显示该点提示，“最近点击”显示“阅读量 / 周一：17”。Canvas 点选也会更新这段文字。
4. 点击“复位业务数据”恢复原数组。整个过程复用已有实例；容器上的实例身份在更新前后保持一致。

最小配置映射与实际函数一致：

```ts
{
  xAxis: { type: 'category', data: [...labels] },
  yAxis: { type: 'value', min: 0 },
  series: [{ id: 'current-reads', type: 'bar', data: [...values] }],
}
```

`xAxis.data` 与 `series.data` 的索引必须对应。SDK 不知道“缺失”是否应当变成 0；接接口时先验证有限数值、单位、日期排序和缺失语义，再构造配置。不要用 `Number(input) || 0` 隐藏错误数据。

## 实验二：上周对照与删除系列

工程问题：业务临时移除对照线时，怎样避免上一份配置的 series 残留？

1. 切到“对照系列与整份配置替换”。本周柱与上周折线共享同一组日期和数值轴，合计分别为 158、129，文本表格有两行。
2. 取消“显示上周对照”：配置只剩 `current-reads`，旧折线、上周图例和表格行一起移除。
3. 再勾选：`previous-reads` 重新加入。可通过图例隐藏/显示系列，但下一次整份替换会重建图例状态。

本例每次提供完整配置，因此真实调用是：

```ts
chart.setOption(option, { notMerge: true, lazyUpdate: true })
```

`notMerge: true` 会丢弃旧配置再应用新配置，所以删除 series 不会留下旧折线；代价是图例选择、缩放等 SDK 内部状态不在此例保留。`lazyUpdate: true` 将绘制更新安排到后续帧，它不等于减少网络请求，也不保证每个业务 setState 都被合并。

ECharts 默认会合并组件，稳定的 `id` 能帮助匹配。生产中若要替换 series 且保留其他组件状态，可以研究 `replaceMerge: ['series']`，并用自己的图例/缩放操作验收；本 Demo 没有把它混进当前整份替换策略，也没有启用 dataset、encode 或 dataZoom。

## 实验三：周期数据、播放门禁与容器尺寸

工程问题：周期更新和卡片缩放怎样复用实例，同时避免后台无意义工作？

1. 进入“播放门禁、容器缩放与回收”，点击“启动增量更新”。每 1200ms 轮流给一天加 3，段数不增加，仍是固定七天；图、表、合计和配置同步变化。
2. 点击“暂停增量更新”，数值应停止。页面隐藏或图表滚出视口也会暂停；用户播放意图仍在时，重新可见可继续。
3. 操作系统启用减少动态时，点击启动仍显示“已暂停（页面隐藏、离屏或减少动态）”，更新次数不增加。只有主动勾选“允许动态演示”才覆盖该偏好，不能覆盖隐藏页或离屏限制。
4. 点击“缩小容器，观察 resize”：容器宽度变为原来的 65%，图表逻辑宽度随之改变，高度仍为 300px。点击“恢复宽图”返回；实例身份不变。页面显示的尺寸来自真实 `chart.getWidth()/getHeight()`。
5. 最多更新 120 次，然后停止；点击“复位业务数据”同时清 tick ref、更新次数 ref、数据和播放意图。离开 Demo 后释放实例，重新进入从初始状态开始。

[`stream-policy.ts`](examples/stream-policy.ts) 是自建播放门禁与数据变化规则：advanced + 用户请求 + 页面/容器可见 + 未到上限 + 动态偏好允许，才启动 interval。ECharts 不会替应用暂停数据源；如果接入网络订阅，请按同样所有权另外取消请求或订阅，不能把 `dispose()` 当作请求取消。

## 最小接入与资源所有权

在已有 React TypeScript 工程安装 `pnpm add echarts@6.1.0`。复制 `example.tsx`、`reading-option.ts`、`stream-policy.ts`、`workshop.css`，保留相对导入；渲染 `<EchartsExample level="basic" />`。`demo.tsx` 只用于 Lab 的重导出。CSS 提供局部布局与焦点样式，图容器在源码中为 300px 高，宽度由父容器决定。SSR 应用只在客户端挂载本组件。

模块顶层一次 `use()` 注册 BarChart、LineChart、Grid、Tooltip、Legend、Title 和 CanvasRenderer；从 `echarts/core` 按需导入必须显式注册 renderer。应用入口可动态导入这个组件，避免阅读讲解时加载交互图表；按需注册不等于已测量包体积。

```ts
use([BarChart, GridComponent, CanvasRenderer])
// DOM 已提交且有尺寸后：
const chart = init(container, undefined, { renderer: 'canvas' })
chart.setOption(option)
// 容器尺寸改变时：chart.resize()
// 卸载时：chart.dispose()
```

完整实现还有以下不可省略的处理：

- React ref 保存实例，effect 初始化；更新数据不重新 `init`。
- `ResizeObserver` 监听实际图容器，而不是只听 `window.resize`。它把一次爆发收敛到一个 requestAnimationFrame，宽高为 0 时不 resize。
- 清理时断开 ResizeObserver、取消未执行的帧、以原 handler `off('click')`、dispose 当前实例并清 ref。IntersectionObserver、media change 和 visibilitychange 也各自成对清理。
- interval 的 effect 只依赖实际播放是否允许；每次 tick 不重建 interval，卸载/暂停/达到上限时清除它。StrictMode 的挂载—清理—重挂也要成对。
- Canvas 不是逐点可读的数据结构。相同数字的可访问表格提供键盘操作；`role="img"` 和短说明不能独自完成整张图的无障碍要求。生产仍需检查颜色对比、趋势文字和真实读屏。

## 取舍与验证边界

本地七个点不支持高频大数据性能结论。真实看板应先规定刷新频率和保留窗口，按需要聚合/采样，再决定动画与渲染器；不要在组件 effect 中直接修改原数组。数据请求、缓存、loading 和错误恢复由数据层管理，图表只消费明确版本的数据。

本例保留内置 `trigger: 'axis'`、`confine: true` 的 tooltip，没有拼接不可信 HTML formatter。若自定义 HTML，需要单独处理文本转义与 URL 策略。地图、字体、瓦片和第三方素材的许可独立于 ECharts 的 Apache-2.0。

SDK 套件使用真实 ECharts SVG SSR，并共享同一配置函数，能证明轴、系列、更新/移除、逻辑 resize 和 dispose 的 SDK 行为；它不能证明浏览器 Canvas、Observer、提示框、离屏暂停或读屏。以上浏览器操作由独立验收确认，正式收据状态继续读取 verification.json。本轮实际命令、日志、六项复核和未测项记录在 local-validation.md。

## 官方资料

固定版本为 [6.1.0 的提交](https://github.com/apache/echarts/tree/c5a48f5f97d23e5379720870b8444cd05b50ffb4)。核对完整 tree 的 README 候选后，没有该版本官方中文主 README，因此保存英文原文字节；中文官网和手册仍是首选教学资料。快照摘要、来源、同步日期和完整响应头在 library.json / official/source-evidence.json。

- [官方中文按需引入](https://echarts.apache.org/handbook/zh/basics/import/)
- [官方容器尺寸与销毁](https://echarts.apache.org/handbook/zh/concepts/chart-size/)
- [官方动态数据](https://echarts.apache.org/handbook/zh/how-to/data/dynamic-data/)
- [官方中文 API](https://echarts.apache.org/zh/api.html)

中文官网本次 GET 200，但同时返回 `X-Frame-Options: sameorigin` 和 CSP `frame-ancestors 'self'`，明确禁止从 Lab 跨源嵌入；官网页签应显示限制与直达入口。这个 blocked 判断来自响应头，不是 SDK 运行失败，也没有把“未在浏览器确认”冒称 allowed。
