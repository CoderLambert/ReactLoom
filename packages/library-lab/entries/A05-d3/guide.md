# D3：把数据映射成坐标，再按身份更新图元

一张七天阅读图需要自定义柱的位置、两条趋势线和筛选后的节点更新。D3提供比例尺、轴、形状生成器与数据联结；它不是带好所有交互的图表组件。标准报表可先比较ECharts、Recharts或Chart.js，需要控制每个图元和数据映射时再选D3。

本例锁定 `d3@7.9.0`（ISC），直接按名导入公开API。七天阅读/收藏是原创确定性fixture，没有新闻接口、远程数据或实时采样服务。三个目标依次解释 **数据到坐标 → 多指标到路径 → 身份到动态DOM更新**。

## 先划清React和D3的写入范围

React创建SVG容器及其role/名称，管理控件、数据表和选中日期。D3通过svgRef设置该SVG的viewBox，独占内部的轴、文字、柱、路径和圆点。JSX没有同时映射这批子节点；D3也不改表格或宿主页面。

D3的比例尺/数组等模块本身不操作DOM，也可以在React render里计算后让JSX绘图；axis/selection/transition会改DOM，必须分配专用ref子树。这是两种明确的所有权方案，不是“生产必须某一种”。本例选择D3拥有整张SVG内部，方便直接观察keyed join。

```text
React days/minimum → visibleSeries → 当前绘制数据
                               ↓
                 band/linear尺度 → axis + rect/path/circle
                               ↓
                keyed join(day) → 新建/更新/移除真实节点
指针datum或表格按钮 → React selected → 同一天高亮和状态
```

[chart-policy.ts](examples/chart-policy.ts) 保存原始fixture和窗口/阈值策略；[chart-geometry.ts](examples/chart-geometry.ts) 计算真实尺度与路径；[draw-chart.ts](examples/draw-chart.ts) 拥有SVG写入与清理；[example.tsx](examples/example.tsx) 负责React接线。

## 实验一：比例尺不是屏幕坐标本身

打开“比例尺、轴与柱的坐标”。7天阅读量为48、73、64、96、87、112、103。柱子的X由scaleBand按day分类映射，宽度取bandwidth；Y由scaleLinear把数量映射为SVG坐标。SVG向下为正，所以Y的range从234倒向24，数值越大，柱顶越靠上；柱高是y(0)-y(views)。

```ts
const x = scaleBand<string>().domain(rows.map(row => row.day))
  .range([margin.left, width - margin.right]).padding(0.26)
const y = scaleLinear().domain([0, ceiling]).range([234, 24]).nice()
```

这是关键机制示意，完整边界/空集处理以同源chart-geometry为准。domain是数据范围，range是绘图范围；nice调整显示域以方便刻度，不改原始阅读量。axisBottom/axisLeft读取同一尺度，在各自专用g中产生真实tick/path；它们不会决定你的业务值。

将指针移到周一柱，状态应显示阅读48、收藏13；用Tab到表格“周四”按钮并Enter，状态和实际图元data-selected应一起变化。表格仍保留原始两个指标，basic柱只映射阅读量。band尺度没有连续invert；本例直接从事件回调的绑定datum取day，不从像素猜业务身份。

展开“查看比例尺、数据联结与真实SVG结果”：domain/range/bandwidth/ticks来自真实D3返回值；marks中的x/y来自绘制后的SVG属性。先比较数据48/112，再比较对应y，理解为什么较大的值映射到较小的SVG y坐标。结果不是预填的一套替代坐标。

## 实验二：两个指标生成两条真实路径

打开“双指标折线与真实路径”。绿色是阅读数，橙色是收藏数，二者单位都是次数，共用同一线性Y轴，显示域覆盖两指标。每个时间点的X取band中心；line<ReadingPoint>()把一列值映射为SVG路径字符串，再交给真实path的d属性。阅读量圆点提供命中目标，悬停时同时显示该天两值；收藏线没有另一套命中控件，精确值始终可读表。

`curveMonotoneX`在X单调的前提下按Steffen方法保持Y单调段，不会在相邻输入点之间制造新的局部极值。它仍是展示插值，不代表那些中间时刻真的采样过。需要逐段直线表达时可选curveLinear；是否平滑是产品选择，不把插值当事实。

真实路径使用defined检查相应指标的有限值，使无效点产生断段而不是伪造0。当前UI的七天fixture均有效，没有缺失值输入实验；生产仍需先校验两指标、唯一身份与顺序。连续时间数据应另选连续时间尺度，不能把分类band当自动时间排序器。

## 实验三：筛选时保留谁，移除谁

打开“按身份联结、筛选与重绘”。先悬停周日圆点，再将“日期窗口”改成最近3天：图中只剩周五/六/日，周日仍是原来的DOM节点，只是坐标更新；周一退出并被移除。表格也只显示这个日期窗口。

将“阅读阈值”设为100：图仅周六112、周日103，原始表还保留被阈值隐藏的周五87，其按钮禁用。若原先选择的是被滤掉的日期，状态明确说明它不在当前绘制结果，不把旧高亮当新结果。阈值115会得到空图元/空路径和明确空态，表仍显示窗口内原始数据；“恢复”回7天/阈值0/未选择。

真正的数据联结发生在同一selection上：

```ts
selection.data(rows, row => row.day).join(
  enter => enter.append('circle'),
  update => update,
  exit => exit.interrupt().on('.a05', null).remove(),
)
```

完整实现分别处理柱/圆点/两条按series key联结的路径，不是每次先清空所有节点再声称复用。day只在本例七天fixture内唯一；生产按日期/小时追加时必须使用永久唯一ID，重复key会改变enter/exit语义。选择变化、宽度变化也会触发update，检查器的joined是**最近一次重绘的主图元selection**计数，不是累计资源指标或只对应某个按钮。

勾“使用窄面板”会真实缩窄容器，ResizeObserver把有效宽度交回React，再计算viewBox/尺度/坐标轴。宽度测量拒绝0/非有限数并限到4096，绘图逻辑最少240宽；窄屏实际SVG会按viewBox缩放，不能把逻辑坐标直接当页面像素。数据身份不因resize变化。

## 更新与卸载是两条路径

重绘调用真实join更新现有节点，先interrupt未命名transition，但不全量remove。事件用pointerenter.a05，更新时替换相同命名空间的监听；退出和卸载只清.a05。卸载才interrupt根及子节点、移除自有命名空间事件并remove整个子树，ResizeObserver另disconnect。

没有正在播放的动画、brush/zoom、RAF循环或请求；interrupt是当前清理边界，不声称取消了不存在的动画。D3比例尺不需要dispose，D3也没有这张图的统一destroy实例。本例data-d3-cleaned只在实际clearChart完成后写入，是自建观察，不是SDK公开生命周期属性；逐项原生资源解绑仍需要独立观察。

## 迁移与前提

复制example.tsx、chart-policy.ts、chart-geometry.ts、draw-chart.ts、workshop.css；demo.tsx只是Lab导出适配器。需要React浏览器、d3@7.9.0和对应类型；本仓库@types/d3为7.4.3，类型包版本号不等于运行包版本。保持SVG子树唯一写者、专用ref和样式选择器，别在同一图元上又用JSX又用D3。

D3主包聚合子模块，本机锁定安装的selection3.0.1/scale4.0.3/axis3.0.1/shape3.2.1/transition3.0.2与主包7.9.0分别记录；不擅改共享依赖或并装第二套。当前仅7点，没有Canvas、海量性能、刷选缩放、导出或网络边界，不能从这张图推断吞吐。

## 官方原文与验证范围

官方v7.9.0 annotated tag8186f1d496fef3cef9322d7ceeac1df11ddd30fd指向commit `1f8dd3b92960f58726006532c11e9457864513ec`，固定package.json为7.9.0。完整tree仅根英文README.md，无官方中文候选；保存 [原文](official/readme.md) 754字节，SHA-256 `9a2a0f2296eb2670503c682f120ce6068fe81c639978c6fe7b3303b30f2e41b3`，[固定出处](https://github.com/d3/d3/blob/1f8dd3b92960f58726006532c11e9457864513ec/README.md)。它是概览，不代替本页教学。

[官方React接入](https://d3js.org/getting-started)、[data/join](https://d3js.org/d3-selection/joining)、[事件命名空间](https://d3js.org/d3-selection/events)、[Monotone曲线](https://d3js.org/d3-shape/curve#curveMonotoneX)结合本地实际子模块源码核对。在线站点显示更新版本，不冒称它是7.9.0快照；固定原文、语言、日期、版本与完整官网响应在 [source-evidence](official/source-evidence.json)。官网GET200无XFO/CSP，未从Lab origin浏览器实测，保持unknown及直达。

Node SDK仅执行真实尺度/shape算法，纯窗口/阈值/宽度策略另记；没有伪造document或SVG来宣布绘图通过。轴、keyed节点身份、指针、键盘、resize和卸载仍由主控运行三目标真实浏览器提案。完整命令/退出码/日志/六项见 [local-validation](local-validation.md)，formal verification保持NOT_RUN。
