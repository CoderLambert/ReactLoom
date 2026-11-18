# Recharts：让状态同时驱动 SVG 图表和数据表

运营页要看七天阅读变化，也要准确读出每一天的收藏量和比率。Recharts 用 React 组件声明坐标轴、柱、线和 Tooltip，适合跟 React 状态一起更新的 SVG 业务报表。这里用 `recharts@3.10.1`、`react-is@19.3.0`，图表与原生表格始终读取同一 `rows`。数据来自本地确定性函数，不是在线统计或模型服务。

本条目保留原研究来源，当前内容为 `recreated`，不继承历史测试结果。需要很多图表类型或复杂坐标系可对照 A01 ECharts；密集时序先在目标点数上测量 A04 uPlot。14天示例不能推出万点性能结论。

## 三个目标怎样操作

### 1. 看见 React 数据更新

打开“响应式阅读量柱状图”。初始7行、7根阅读柱，合计1613次；表第一行周一为140次。点“增加阅读数据”，数据轮次变1，同一行变142次，合计1648次，真实柱图和悬浮数据一起更新。

`sampleRows(7, revision)`生成数组，`BarChart data={rows}`和表格`rows.map`共用它；`Bar dataKey="reads"`读取阅读值，`XAxis dataKey="day"`读取稳定的类目身份。没有手工修改 SVG 或调用 `setOption`。

### 2. 次数与比率使用不同轴

打开“阅读与收藏双指标”。阅读和收藏是两个柱系列，共用左侧`yAxisId="count"`；收藏率是折线，对应右侧`yAxisId="percentage"`，范围0–100、单位%。周一初始收藏22次、收藏率16%，比率按`Math.round(100 * saved / reads)`计算。

```tsx
<ComposedChart data={rows} accessibilityLayer={false}>
  <XAxis dataKey="day" />
  <YAxis yAxisId="count" allowDecimals={false} />
  <YAxis yAxisId="percentage" orientation="right" domain={[0, 100]} unit="%" />
  <Tooltip />
  <Bar dataKey="reads" yAxisId="count" name="阅读量" />
  <Bar dataKey="saved" yAxisId="count" name="收藏量" />
  <Line dataKey="rate" yAxisId="percentage" name="收藏率" unit="%" />
</ComposedChart>
```

`dataKey`只取值，不知道业务单位。次数和百分比不能因为都用number就共用刻度。Tooltip里的收藏率也带%，不只在轴上注明单位。图例用于解释系列，当前没有接图例点击隐藏；不要把它当筛选按钮。

### 3. 改范围，区分数据与显示

打开“动态数据范围与边界”。把“窗口天数”改为14，图和表变为14天；第二周用“周一·2”等唯一标签，不与第一周复用身份。输入1收敛为3天，20收敛为14天；清空或暂时输入非法内容时保留上一组合法数据，失焦把输入框写回当前合法天数。

取消“显示收藏率”：折线、右轴和对应图例项消失，阅读/收藏柱及原始表格的收藏率列保留。这个开关改变视觉系列，不删除原数据。再次勾选恢复。刷新数据保留当前范围和开关；最多1000轮，达到上限后按钮禁用。

宿主“重置此示例”或停止后重新运行，回到7天、轮次0、收藏率开启。离开Demo页签卸载图表；没有网络、轮询或持久化，重进不会保留上次范围。

## 数据、尺寸和生命周期

```text
原生控件 → count / revision / showRate
                 ↓
          sampleRows → rows
                 ├→ 合计与语义table
                 └→ Recharts data/dataKey → SVG
父容器尺寸 → ResponsiveContainer → 图表布局
```

`chart-policy.ts`只负责本地fixture和边界：窗口3–14，revision有限整数且上限1000，类目唯一，收藏量不超过阅读量。生产API需要独立校验空值、重复日期、时区和单位；本例没有请求取消、错误重试或缺失值场景，不把未知数据补成0。

复制`examples/example.tsx`、`chart-policy.ts`、`styles.css`；`demo.tsx`是Lab适配出口，可按业务入口替换。依赖按宿主React版本对齐`react-is`，本仓库两者均19.3.0。官方README要求与已安装React版本匹配，不只看本例能否编译。

父容器有320px高度、100%宽度和`min-width:0`；`ResponsiveContainer`使用百分比宽高与`debounce={60}`。3.10.1内部使用ResizeObserver并在卸载disconnect，debounce参数实际走尾沿throttle；应用不另造observer或操作内部SVG。容器隐藏/宽度为0会影响测量，必须在真实浏览器检查宽窄变化，不从类型通过推定布局通过。

Bar/Line显式保留`isAnimationActive="auto"`：3.10.1在SSR或系统`prefers-reduced-motion: reduce`时关闭动画，正常浏览器按SDK默认时长播放。SDK负责媒体查询监听和动画资源清理；本例没有强制true绕过门禁。Tooltip也保留该版本默认auto。

## 可访问数据表与焦点

图形是视觉视图，容器`aria-hidden="true"`；语义表格提供标题、列头、行头和所有数值，控件使用原生button/input。3.10.1默认开启图表的`accessibilityLayer`并给SVG `tabIndex=0`，因此这里明确`accessibilityLayer={false}`，避免辅助技术隐藏的SVG仍被Tab聚焦。

这是一项明确的产品取舍：图表Tooltip保留指针查看，键盘和辅助技术从表格读取，不声称实现SDK图表键盘导航或全面WCAG验收。表格内容可由辅助技术逐行读取；表格本身无需额外tabIndex，也不把每个单元格变成Tab停靠点。

| 常见问题 | 本例做法 |
| --- | --- |
| 容器auto高度但图高100% | 父级明确高度，flex/grid子项可收缩 |
| 图表与表分别随机造数据 | 同一rows；render里不随机 |
| 比率和次数共用一根轴 | 不同yAxisId，百分比域与单位明确 |
| 隐藏图形但留下SDK焦点 | aria-hidden与accessibilityLayer=false配套 |
| 数据更新就改图表key | 保持组件身份，用data props更新 |

## 官方来源与当前证据

固定官方`recharts/recharts`提交`ffb918798051ef040bb7f9922d3850c9c189f39f`（v3.10.1）根README原文在`official/readme.md`，4046字节，SHA-256 `b7261f5d2719719a297a001d673f01d49363542660b408a6b8de627143adb04e`。完整tree的8个README候选无中文版本；官网有[官方中文入口](https://recharts.github.io/zh-CN/)，但不能把网页当中文README。语言、日期、路径与固定版本在`official/source-audit.json`及library.json。

中文官网本次GET200，完整响应头在`official/homepage-response.json`；XFO/CSP均null，未从Lab origin做iframe实测，状态为unknown，保留直达。当前在线文档可能随release变化，关键行为以已装3.10.1源码/类型为准。

Node真实SSR探查在3.10.1只输出图表wrapper，未执行浏览器effects，未得到SVG；它不是图表绘制PASS。既有4项纯策略检查也不能证明SDK布局。正式verification保持NOT_RUN；真实柱高变化、Tooltip、双轴、响应式、动画门禁和卸载由主控执行`validation/browser-proposal.txt`中的真实Playwright提案。六项结论与实际命令见`local-validation.md`。没有新增SDK mock、伪SVG或截图替代结果。
